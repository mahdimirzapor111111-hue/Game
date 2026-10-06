import React, { useState, useEffect, useRef } from 'react';
import {
  CardDef,
  CombatCardRuntime,
  UserProfile,
  StageDef,
  AllPagesConfig,
  BattleMode,
  BotDifficulty,
  getLeagueByTrophies,
} from '../types/game';
import { CardView, CardDetailsModal } from './CardView';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';
import {
  updateUserProfile,
  getCardScaledStats,
  calculateCardProgressFromWins,
  recordEventWin,
  recordEventLevelUp,
} from '../services/storage';

interface BattleScreenProps {
  user: UserProfile | null;
  cardLibrary: CardDef[];
  stage?: StageDef | null;
  battleMode?: BattleMode;
  opponentProfile?: UserProfile | null;
  botDifficulty?: BotDifficulty;
  config: AllPagesConfig['battlePage'];
  onBattleEnd: () => void;
  onRefreshUser: (u: UserProfile) => void;
  onGoToDeck: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  user,
  cardLibrary,
  stage,
  battleMode = 'campaign',
  opponentProfile,
  botDifficulty = 'normal',
  config,
  onBattleEnd,
  onRefreshUser,
  onGoToDeck,
}) => {
  const [board, setBoard] = useState<(CombatCardRuntime | null)[][]>(() =>
    Array.from({ length: 6 }, () => Array(3).fill(null))
  );
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [turnCount, setTurnCount] = useState(1);
  const [selectedCardPos, setSelectedCardPos] = useState<[number, number] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [gameOver, setGameOver] = useState<'victory' | 'defeat' | null>(null);
  const [combatLogs, setCombatLogs] = useState<{ id: string; text: string; color?: string }[]>([]);
  const [screenShaking, setScreenShaking] = useState(false);
  const [damageFloats, setDamageFloats] = useState<
    { id: string; text: string; color: string; x: number; y: number }[]
  >([]);
  const [inspectCard, setInspectCard] = useState<CombatCardRuntime | null>(null);
  const [lostCardNames, setLostCardNames] = useState<string[]>([]);
  const lostCardIdsRef = useRef<Set<string>>(new Set());
  const [leveledUpCards, setLeveledUpCards] = useState<{ name: string; oldLv: number; newLv: number }[]>([]);
  const [missingKingError, setMissingKingError] = useState(false);
  const [trophiesDelta, setTrophiesDelta] = useState<number | null>(null);
  const [promotedLeagueName, setPromotedLeagueName] = useState<string | null>(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(60);
  const [surrenderModalOpen, setSurrenderModalOpen] = useState<boolean>(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const battleSeqRef = useRef<number>(0);

  const addLog = (text: string, color?: string) => {
    setCombatLogs((prev) => [{ id: Math.random().toString(), text, color }, ...prev.slice(0, 40)]);
  };

  const triggerShake = () => {
    setScreenShaking(true);
    setTimeout(() => setScreenShaking(false), 380);
  };

  const showDamageFloat = (row: number, col: number, text: string, color: string) => {
    const slotEl = document.getElementById(`slot-${row}-${col}`);
    if (!slotEl || !boardRef.current) return;
    const sRect = slotEl.getBoundingClientRect();
    const bRect = boardRef.current.getBoundingClientRect();
    const x = sRect.left - bRect.left + sRect.width / 2 - 16;
    const y = sRect.top - bRect.top + 8;
    const fid = Math.random().toString();
    setDamageFloats((prev) => [...prev, { id: fid, text, color, x, y }]);
    setTimeout(() => {
      setDamageFloats((prev) => prev.filter((f) => f.id !== fid));
    }, 800);
  };

  useEffect(() => {
    battleSeqRef.current++;
    const currentSeq = battleSeqRef.current;
    lostCardIdsRef.current.clear();
    setLostCardNames([]);
    setLeveledUpCards([]);

    const deck = user?.activeDeck;
    let hasKingInPlayerDeck = false;

    if (deck) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cid = deck[r]?.[c];
          if (cid) {
            const def = cardLibrary.find((x) => x.id === cid);
            if (def?.type === 'king') {
              hasKingInPlayerDeck = true;
            }
          }
        }
      }
    }

    if (!hasKingInPlayerDeck) {
      setMissingKingError(true);
      return;
    } else {
      setMissingKingError(false);
    }

    const newBoard: (CombatCardRuntime | null)[][] = Array.from({ length: 6 }, () =>
      Array(3).fill(null)
    );

    if (opponentProfile && (battleMode === 'pvp_ranked' || battleMode === 'pvp_friendly')) {
      const oppDeck = opponentProfile.activeDeck;
      let hasOppKing = false;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cardId = oppDeck?.[r]?.[c];
          if (cardId) {
            const rawCard = cardLibrary.find((x) => x.id === cardId);
            if (rawCard) {
              const oppProg = opponentProfile.cardProgress?.[cardId];
              const scaled = getCardScaledStats(rawCard, oppProg);
              if (rawCard.type === 'king') hasOppKing = true;
              const boardRow = 2 - r;
              newBoard[boardRow][c] = {
                ...rawCard,
                currentHealth: scaled.health,
                currentAttack: scaled.attack,
                maxHealth: scaled.health,
                cardLevel: scaled.level,
                isPlayer: false,
                hasAttacked: false,
                thorns: 0,
                shield: 0,
                poison: 0,
                burn: 0,
                dodge: 0,
                taunt: false,
                silenced: false,
                frozen: false,
                dead: false,
                lastStandUsed: false,
                resurrectUsed: false,
                boardRow: boardRow,
                boardCol: c,
              };
            }
          }
        }
      }
      if (!hasOppKing) {
        const kingCard = cardLibrary.find((x) => x.type === 'king') || cardLibrary[0];
        if (kingCard) {
          newBoard[0][1] = {
            ...kingCard,
            currentHealth: kingCard.health,
            currentAttack: kingCard.attack,
            maxHealth: kingCard.health,
            cardLevel: 1,
            isPlayer: false,
            hasAttacked: false,
            thorns: 0,
            shield: 0,
            poison: 0,
            burn: 0,
            dodge: 0,
            taunt: false,
            silenced: false,
            frozen: false,
            dead: false,
            lastStandUsed: false,
            resurrectUsed: false,
            boardRow: 0,
            boardCol: 1,
          };
        }
      }
    } else if (stage && stage.enemyFormation) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cardDef = stage.enemyFormation[r]?.[c];
          if (cardDef) {
            newBoard[r][c] = {
              ...cardDef,
              currentHealth: cardDef.health,
              currentAttack: cardDef.attack,
              maxHealth: cardDef.health,
              cardLevel: 1,
              isPlayer: false,
              hasAttacked: false,
              thorns: 0,
              shield: 0,
              poison: 0,
              burn: 0,
              dodge: 0,
              taunt: false,
              silenced: false,
              frozen: false,
              dead: false,
              lastStandUsed: false,
              resurrectUsed: false,
              boardRow: r,
              boardCol: c,
            };
          }
        }
      }
    } else {
      const diffMul =
        botDifficulty === 'easy' ? 0.75 :
        botDifficulty === 'hard' ? 1.25 :
        botDifficulty === 'nightmare' ? 1.55 : 1.0;

      const eCard = (id: string, r: number, c: number) => {
        const found = cardLibrary.find((x) => x.id === id) || cardLibrary[0];
        if (!found) return null;
        const scaledAtk = Math.max(1, Math.round(found.attack * diffMul));
        const scaledHp = Math.max(1, Math.round(found.health * diffMul));
        return {
          ...found,
          currentHealth: scaledHp,
          currentAttack: scaledAtk,
          maxHealth: scaledHp,
          cardLevel: botDifficulty === 'nightmare' ? 3 : botDifficulty === 'hard' ? 2 : 1,
          isPlayer: false,
          hasAttacked: false,
          thorns: 0,
          shield: 0,
          poison: 0,
          burn: 0,
          dodge: 0,
          taunt: false,
          silenced: false,
          frozen: false,
          dead: false,
          lastStandUsed: false,
          resurrectUsed: false,
          boardRow: r,
          boardCol: c,
        };
      };

      newBoard[0][1] = eCard('hero_div_sepid', 0, 1);
      newBoard[0][0] = eCard('hero_simurgh', 0, 0);
      newBoard[0][2] = eCard('hero_simurgh', 0, 2);
      newBoard[1][1] = eCard('hero_kaveh', 1, 1);
      newBoard[1][0] = eCard('hero_arash', 1, 0);
      newBoard[1][2] = eCard('hero_sohrab', 1, 2);
      newBoard[2][0] = eCard('hero_siyavash', 2, 0);
      newBoard[2][1] = eCard('hero_kaveh', 2, 1);
      newBoard[2][2] = eCard('hero_siyavash', 2, 2);
    }

    if (deck) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cardId = deck[r]?.[c];
          if (cardId) {
            const cardDef = cardLibrary.find((x) => x.id === cardId);
            if (cardDef) {
              const scaled = getCardScaledStats(cardDef, user?.cardProgress?.[cardDef.id]);
              const actualRow = r + 3;
              newBoard[actualRow][c] = {
                ...cardDef,
                attack: scaled.attack,
                health: scaled.health,
                currentHealth: scaled.health,
                currentAttack: scaled.attack,
                maxHealth: scaled.health,
                cardLevel: scaled.level,
                isPlayer: true,
                hasAttacked: false,
                thorns: 0,
                shield: 0,
                poison: 0,
                burn: 0,
                dodge: 0,
                taunt: false,
                silenced: false,
                frozen: false,
                dead: false,
                lastStandUsed: false,
                resurrectUsed: false,
                boardRow: actualRow,
                boardCol: c,
              };
            }
          }
        }
      }
    }

    setBoard(newBoard);
    setTurn('player');
    setTurnCount(1);
    setSelectedCardPos(null);
    setGameOver(null);
    addLog('نبرد اساطیری آغاز شد.', '#ffd54f');

    setTimeout(() => {
      if (battleSeqRef.current === currentSeq) {
        runOnStartAbilities(newBoard);
      }
    }, 600);
  }, [stage, user, battleMode, opponentProfile, botDifficulty]);

  const runOnStartAbilities = (currentBoard: (CombatCardRuntime | null)[][]) => {
    const updated = currentBoard.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        const unit = updated[r][c];
        if (!unit || unit.dead) continue;

        if (unit.sounds?.start) {
          sound.playCustomCardSound(unit.sounds.start);
        }

        const onStartList = unit.abilities?.onStart || [];
        for (const ab of onStartList) {
          addLog(`کارت ${unit.name} قابلیت شروع [${ab.label}] را اجرا کرد.`, '#4fc3f7');
          sound.play('ability');
          applyAbilityAction(updated, unit, ab);
        }
      }
    }
    setBoard(updated);
  };

  const applyAbilityAction = (
    b: (CombatCardRuntime | null)[][],
    source: CombatCardRuntime,
    ab: { action: string; amount: number; targetSide: 'ally' | 'enemy'; positions: [number, number][] }
  ) => {
    const wantPlayer = ab.targetSide === 'ally' ? source.isPlayer : !source.isPlayer;
    ab.positions.forEach(([r, c]) => {
      const target = b[r]?.[c];
      if (!target || target.dead || target.isPlayer !== wantPlayer) return;

      switch (ab.action) {
        case 'buffAttack':
          target.currentAttack += ab.amount;
          showDamageFloat(r, c, `+${ab.amount} قدرت`, '#ffd54f');
          break;
        case 'shield':
          target.shield += ab.amount;
          showDamageFloat(r, c, `+${ab.amount} سپر`, '#4fc3f7');
          break;
        case 'heal':
          target.currentHealth = Math.min(target.maxHealth, target.currentHealth + ab.amount);
          showDamageFloat(r, c, `+${ab.amount} جان`, '#69f0ae');
          break;
        case 'freeze':
          if (target.type !== 'god') {
            target.frozen = true;
            showDamageFloat(r, c, 'یخ‌زدگی!', '#00e5ff');
          }
          break;
        case 'taunt':
          target.taunt = true;
          showDamageFloat(r, c, 'تحریک نبرد!', '#ff8a80');
          break;
        case 'cleanse':
          target.poison = 0;
          target.burn = 0;
          target.frozen = false;
          target.silenced = false;
          showDamageFloat(r, c, 'پاکسازی!', '#69f0ae');
          break;
        case 'poison':
          if (target.type !== 'god') {
            target.poison += ab.amount;
            showDamageFloat(r, c, `زهر +${ab.amount}`, '#ce93d8');
          }
          break;
        case 'burn':
          if (target.type !== 'god') {
            target.burn += ab.amount;
            showDamageFloat(r, c, `آتش +${ab.amount}`, '#ff7043');
          }
          break;
        case 'thorns':
          target.thorns += ab.amount;
          showDamageFloat(r, c, `خار +${ab.amount}`, '#4fc3f7');
          break;
        case 'damage':
          applyDamageToCard(target, ab.amount, source);
          showDamageFloat(r, c, `-${ab.amount} آسیب`, '#ff1744');
          break;
        case 'nerfAttack':
          if (target.type !== 'god') {
            target.currentAttack = Math.max(0, target.currentAttack - ab.amount);
            showDamageFloat(r, c, `-${ab.amount} قدرت`, '#ff8a80');
          }
          break;
        case 'destroyMage':
          if (target.type === 'mage' && target.tier !== 'god') {
            applyDamageToCard(target, 9999, source);
            showDamageFloat(r, c, 'نابودی جادوگر!', '#ff1744');
          }
          break;
        case 'destroyDefender':
          if ((target.type === 'defender' || target.type === 'both') && target.tier !== 'god') {
            applyDamageToCard(target, 9999, source);
            showDamageFloat(r, c, 'نابودی پاسدار!', '#ff1744');
          }
          break;
        case 'destroyAttacker':
          if ((target.type === 'attacker' || target.type === 'both') && target.tier !== 'god') {
            applyDamageToCard(target, 9999, source);
            showDamageFloat(r, c, 'نابودی تازشگر!', '#ff1744');
          }
          break;
        case 'execute':
          if (target.type !== 'god' && target.currentHealth <= ab.amount) {
            applyDamageToCard(target, 9999, source);
            showDamageFloat(r, c, 'اعدام فوری!', '#ff1744');
          }
          break;
        case 'silence':
          if (target.type !== 'god') {
            target.silenced = true;
            showDamageFloat(r, c, 'سکوت!', '#90a4ae');
          }
          break;
        case 'maxHpUp':
          target.maxHealth += ab.amount;
          target.currentHealth += ab.amount;
          showDamageFloat(r, c, `حداکثر جان +${ab.amount}`, '#f06292');
          break;
        case 'maxHpDown':
          if (target.type !== 'god') {
            target.maxHealth = Math.max(1, target.maxHealth - ab.amount);
            target.currentHealth = Math.min(target.currentHealth, target.maxHealth);
            showDamageFloat(r, c, `کاهش حداکثر جان -${ab.amount}`, '#ff8a80');
          }
          break;
        case 'healFull':
          target.currentHealth = target.maxHealth;
          showDamageFloat(r, c, 'شفای کامل!', '#69f0ae');
          break;
        case 'dispel':
          if (target.type !== 'god') {
            target.shield = 0;
            target.thorns = 0;
            target.taunt = false;
            target.dodge = 0;
            showDamageFloat(r, c, 'زدودن جادو!', '#b0bec5');
          }
          break;
        case 'stealAttack':
          if (target.type !== 'god') {
            const stolen = Math.min(target.currentAttack, ab.amount);
            target.currentAttack -= stolen;
            source.currentAttack += stolen;
            showDamageFloat(r, c, `دزدی قدرت -${stolen}`, '#ce93d8');
            showDamageFloat(source.boardRow, source.boardCol, `قدرت دزدیده‌شده +${stolen}`, '#ffd54f');
          }
          break;
        case 'drain':
          if (target.type !== 'god') {
            applyDamageToCard(target, ab.amount, source);
            source.currentHealth = Math.min(source.maxHealth, source.currentHealth + ab.amount);
            showDamageFloat(r, c, `مکیدن جان -${ab.amount}`, '#ff5252');
            showDamageFloat(source.boardRow, source.boardCol, `دریافت جان +${ab.amount}`, '#f06292');
          }
          break;
      }
    });
  };

  const isTargetProtectedByDefender = (
    b: (CombatCardRuntime | null)[][],
    row: number,
    col: number
  ): boolean => {
    if (row === 0) {
      const g1 = b[1]?.[col];
      const g2 = b[2]?.[col];
      return !!(
        (g1 && !g1.dead && (g1.type === 'defender' || g1.type === 'both')) ||
        (g2 && !g2.dead && (g2.type === 'defender' || g2.type === 'both'))
      );
    }
    if (row === 1) {
      const g2 = b[2]?.[col];
      return !!(g2 && !g2.dead && (g2.type === 'defender' || g2.type === 'both'));
    }
    if (row === 5) {
      const g4 = b[4]?.[col];
      const g3 = b[3]?.[col];
      return !!(
        (g4 && !g4.dead && (g4.type === 'defender' || g4.type === 'both')) ||
        (g3 && !g3.dead && (g3.type === 'defender' || g3.type === 'both'))
      );
    }
    if (row === 4) {
      const g3 = b[3]?.[col];
      return !!(g3 && !g3.dead && (g3.type === 'defender' || g3.type === 'both'));
    }
    return false;
  };

  const handleCardClick = (r: number, c: number) => {
    if (isBusy || gameOver) return;
    const card = board[r]?.[c];
    if (!card || card.dead) return;

    if (card.isPlayer) {
      if (turn !== 'player') return;
      if (card.frozen) {
        showDamageFloat(r, c, 'کارت یخ‌زده است!', '#00e5ff');
        sound.play('freeze');
        return;
      }
      if (card.hasAttacked) {
        showDamageFloat(r, c, 'این کارت قبلاً حمله کرده!', '#ff8a80');
        return;
      }
      if (card.type === 'spell') {
        showDamageFloat(r, c, 'افسون‌ها غیرقابل حمله هستند!', '#ffd54f');
        return;
      }

      if (selectedCardPos && selectedCardPos[0] === r && selectedCardPos[1] === c) {
        setSelectedCardPos(null);
      } else {
        setSelectedCardPos([r, c]);
        sound.play('select');
      }
    } else {
      if (!selectedCardPos) {
        setInspectCard(card);
        return;
      }
      const [attR, attC] = selectedCardPos;
      const attacker = board[attR]?.[attC];
      if (!attacker) return;

      if (card.passives?.stealth) {
        let otherEnemyAlive = false;
        for (let er = 0; er < 3; er++) {
          for (let ec = 0; ec < 3; ec++) {
            if ((er !== r || ec !== c) && board[er]?.[ec] && !board[er]?.[ec]?.dead) {
              otherEnemyAlive = true;
            }
          }
        }
        if (otherEnemyAlive) {
          showDamageFloat(r, c, 'استتار فعال است!', '#90a4ae');
          return;
        }
      }

      if (!attacker.passives?.ignoreGuard) {
        if (isTargetProtectedByDefender(board, r, c)) {
          showDamageFloat(r, c, 'محافظت توسط پاسدار جلو!', '#4fc3f7');
          sound.play('shield');
          return;
        }

        let hasTaunt = false;
        for (let er = 0; er < 3; er++) {
          for (let ec = 0; ec < 3; ec++) {
            const eu = board[er]?.[ec];
            if (eu && !eu.dead && eu.taunt && (er !== r || ec !== c)) {
              hasTaunt = true;
            }
          }
        }
        if (hasTaunt && !card.taunt) {
          showDamageFloat(r, c, 'ابتدا کارت تحریک‌شده را بزنید!', '#ff8a80');
          sound.play('taunt');
          return;
        }
      }

      executeAttack(attacker, card);
    }
  };

  const executeAttack = async (attacker: CombatCardRuntime, target: CombatCardRuntime) => {
    setIsBusy(true);
    setSelectedCardPos(null);

    const bCopy = board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
    const att = bCopy[attacker.boardRow][attacker.boardCol]!;
    const tgt = bCopy[target.boardRow][target.boardCol]!;

    att.hasAttacked = true;

    if (att.sounds?.attack) {
      sound.playCustomCardSound(att.sounds.attack);
    } else {
      sound.play('attack');
    }
    sound.play('slash');

    let damage = att.currentAttack;
    if (att.passives?.crit && Math.random() * 100 < att.passives.crit) {
      damage = Math.round(damage * 2);
      showDamageFloat(att.boardRow, att.boardCol, 'ضربه بحرانی!', '#ffd700');
      sound.play('crit');
    }

    addLog(`کارت ${att.name} به ${tgt.name} حمله کرد (${damage} آسیب).`, '#ffd54f');

    if (tgt.dodge > 0 && Math.random() * 100 < tgt.dodge) {
      showDamageFloat(tgt.boardRow, tgt.boardCol, 'جاخالی!', '#b0bec5');
      sound.play('dodge');
      addLog(`کارت ${tgt.name} جاخالی داد!`);
    } else {
      applyDamageToCard(tgt, damage, att);
      showDamageFloat(tgt.boardRow, tgt.boardCol, `-${damage}`, '#ff1744');
      triggerShake();

      if (tgt.thorns > 0 && !tgt.dead) {
        applyDamageToCard(att, tgt.thorns, tgt);
        showDamageFloat(att.boardRow, att.boardCol, `-${tgt.thorns} خار`, '#4fc3f7');
        sound.play('thorns');
        addLog(`خار دفاعی ${tgt.name} به ${att.name} ${tgt.thorns} آسیب زد.`);
      }

      if (att.passives?.cleave) {
        const leftCol = tgt.boardCol - 1;
        const rightCol = tgt.boardCol + 1;
        const halfDmg = Math.floor(damage / 2);
        [leftCol, rightCol].forEach((nc) => {
          if (nc >= 0 && nc <= 2) {
            const sideTgt = bCopy[tgt.boardRow][nc];
            if (sideTgt && !sideTgt.dead) {
              applyDamageToCard(sideTgt, halfDmg, att);
              showDamageFloat(tgt.boardRow, nc, `-${halfDmg} جانبی`, '#ff7043');
            }
          }
        });
      }

      if (att.passives?.doubleStrike && !att.dead) {
        await new Promise((r) => setTimeout(r, 300));
        if (!tgt.dead) {
          applyDamageToCard(tgt, damage, att);
          showDamageFloat(tgt.boardRow, tgt.boardCol, `-${damage} ضربه دوم`, '#ff8a80');
          sound.play('slash');
          addLog(`حمله دوم ${att.name} وارد شد.`);
        }
      }
    }

    setBoard(bCopy);
    checkWinCondition(bCopy);
    setIsBusy(false);
  };

  const applyDamageToCard = (card: CombatCardRuntime, amount: number, source?: CombatCardRuntime) => {
    let actualDmg = amount;
    const pierce = source?.passives?.pierce;

    if (card.shield > 0 && !pierce) {
      if (card.shield >= actualDmg) {
        card.shield -= actualDmg;
        actualDmg = 0;
      } else {
        actualDmg -= card.shield;
        card.shield = 0;
      }
    }

    card.currentHealth -= actualDmg;

    if (card.passives?.berserk && actualDmg > 0) {
      card.currentAttack += card.passives.berserk;
      showDamageFloat(card.boardRow, card.boardCol, `+${card.passives.berserk} خشم`, '#ff8a80');
    }

    if (card.currentHealth <= 0 && card.passives?.lastStand && !card.lastStandUsed) {
      card.currentHealth = 1;
      card.lastStandUsed = true;
      showDamageFloat(card.boardRow, card.boardCol, 'جان سخت!', '#4db6ac');
      sound.play('revive');
      addLog(`کارت ${card.name} با جان سخت زنده ماند!`);
    }

    if (card.currentHealth <= 0 && card.passives?.resurrect && !card.resurrectUsed) {
      card.resurrectUsed = true;
      card.currentHealth = Math.round((card.maxHealth * card.passives.resurrect) / 100);
      showDamageFloat(card.boardRow, card.boardCol, 'رستاخیز!', '#ce93d8');
      sound.play('revive');
      addLog(`کارت ${card.name} با رستاخیز به نبرد بازگشت!`);
    }

    if (card.currentHealth <= 0) {
      card.dead = true;
      if (card.sounds?.death) {
        sound.playCustomCardSound(card.sounds.death);
      } else {
        sound.play('death');
      }

      if (card.isPlayer) {
        lostCardIdsRef.current.add(card.id);
        setLostCardNames((prev) => Array.from(new Set([...prev, card.name])));
        addLog(`کارت شما [${card.name}] نابود شد!`, '#ff1744');
      } else {
        addLog(`کارت دشمن [${card.name}] نابود شد!`, '#ff5252');
      }

      if (!card.silenced) {
        const onDeathList = card.abilities?.onDeath || [];
        for (const ab of onDeathList) {
          addLog(`کارت ${card.name} قابلیت مرگ [${ab.label}] را اجرا کرد.`, '#ce93d8');
          sound.play('ability');
        }
      }
    }
  };

  const handleEndTurn = async () => {
    if (turn !== 'player' || isBusy || gameOver) return;
    setIsBusy(true);
    sound.play('click');
    setTurn('enemy');
    addLog(`نوبت ${turnCount}: دشمن در حال تصمیم‌گیری...`, '#ff8a80');

    const bCopy = board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const u = bCopy[r][c];
        if (u && !u.dead) {
          u.hasAttacked = false;
          if (u.frozen) u.frozen = false;
          if (u.poison > 0) {
            applyDamageToCard(u, u.poison);
            showDamageFloat(r, c, `-${u.poison} زهر`, '#ce93d8');
            u.poison = Math.max(0, u.poison - 1);
          }
          if (u.burn > 0) {
            applyDamageToCard(u, u.burn);
            showDamageFloat(r, c, `-${u.burn} آتش`, '#ff7043');
            u.burn = Math.max(0, u.burn - 1);
          }
          if (u.passives?.regen && u.currentHealth < u.maxHealth) {
            u.currentHealth = Math.min(u.maxHealth, u.currentHealth + u.passives.regen);
            showDamageFloat(r, c, `+${u.passives.regen} بازسازی`, '#69f0ae');
          }
        }
      }
    }
    setBoard([...bCopy]);

    const attackers: CombatCardRuntime[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const u = bCopy[r][c];
        if (u && !u.dead && !u.frozen && u.type !== 'spell') {
          attackers.push(u);
        }
      }
    }

    for (const attacker of attackers) {
      if (attacker.dead) continue;
      await new Promise((res) => setTimeout(res, 600));

      const playerTargets: CombatCardRuntime[] = [];
      for (let pr = 3; pr < 6; pr++) {
        for (let pc = 0; pc < 3; pc++) {
          const pu = bCopy[pr][pc];
          if (pu && !pu.dead) {
            playerTargets.push(pu);
          }
        }
      }

      if (playerTargets.length === 0) break;

      let target = playerTargets.find((p) => p.taunt);
      if (!target) {
        const nonProtected = playerTargets.filter(
          (p) =>
            attacker.passives?.ignoreGuard ||
            !isTargetProtectedByDefender(bCopy, p.boardRow, p.boardCol)
        );
        const candidates = nonProtected.length > 0 ? nonProtected : playerTargets;
        candidates.sort(
          (a, b) => (a.type === 'king' ? -1 : 1) || a.currentHealth - b.currentHealth
        );
        target = candidates[0];
      }

      if (target) {
        sound.play('attack');
        sound.play('slash');
        let dmg = attacker.currentAttack;
        if (attacker.passives?.crit && Math.random() * 100 < attacker.passives.crit) {
          dmg = Math.round(dmg * 2);
          showDamageFloat(attacker.boardRow, attacker.boardCol, 'ضربه بحرانی!', '#ffd700');
          sound.play('crit');
        }
        applyDamageToCard(target, dmg, attacker);
        showDamageFloat(target.boardRow, target.boardCol, `-${dmg}`, '#ff1744');
        triggerShake();
        addLog(`دشمن با ${attacker.name} به ${target.name} ${dmg} آسیب زد.`);
        setBoard([...bCopy]);

        if (checkWinCondition(bCopy)) break;
      }
    }

    await new Promise((res) => setTimeout(res, 500));
    setTurnCount((tc) => tc + 1);
    setTurn('player');

    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        const pu = bCopy[r][c];
        if (pu && !pu.dead) {
          pu.hasAttacked = false;
          if (pu.frozen) pu.frozen = false;
          if (pu.poison > 0) {
            applyDamageToCard(pu, pu.poison);
            showDamageFloat(r, c, `-${pu.poison} زهر`, '#ce93d8');
            pu.poison = Math.max(0, pu.poison - 1);
          }
          if (pu.burn > 0) {
            applyDamageToCard(pu, pu.burn);
            showDamageFloat(r, c, `-${pu.burn} آتش`, '#ff7043');
            pu.burn = Math.max(0, pu.burn - 1);
          }
          if (pu.passives?.regen && pu.currentHealth < pu.maxHealth) {
            pu.currentHealth = Math.min(pu.maxHealth, pu.currentHealth + pu.passives.regen);
            showDamageFloat(r, c, `+${pu.passives.regen} بازسازی`, '#69f0ae');
          }
        }
      }
    }
    setBoard([...bCopy]);
    checkWinCondition(bCopy);
    setIsBusy(false);
  };

  const checkWinCondition = (b: (CombatCardRuntime | null)[][]): boolean => {
    let enemyKingAlive = false;
    let anyEnemyAlive = false;
    let hasEnemyKingDef = false;

    let playerKingAlive = false;
    let anyPlayerAlive = false;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const u = b[r][c];
        if (u) {
          if (u.type === 'king') hasEnemyKingDef = true;
          if (!u.dead) {
            anyEnemyAlive = true;
            if (u.type === 'king') enemyKingAlive = true;
          }
        }
      }
    }

    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        const u = b[r][c];
        if (u && !u.dead) {
          anyPlayerAlive = true;
          if (u.type === 'king') playerKingAlive = true;
        }
      }
    }

    const enemyDefeated = !anyEnemyAlive || (hasEnemyKingDef && !enemyKingAlive);
    const playerDefeated = !anyPlayerAlive || !playerKingAlive;

    if (enemyDefeated && !playerDefeated) {
      setGameOver('victory');
      sound.play('victory');
      handleFinalizeBattle(true);
      return true;
    }

    if (playerDefeated) {
      setGameOver('defeat');
      sound.play('defeat');
      handleFinalizeBattle(false);
      return true;
    }

    return false;
  };

  const handleFinalizeBattle = (won: boolean) => {
    if (!user) return;
    const lostIds = Array.from(lostCardIdsRef.current);
    const newUnlocked = user.unlockedCardIds.filter((cid) => !lostIds.includes(cid));
    const newActiveDeck = user.activeDeck.map((row) =>
      row.map((cid) => (cid && lostIds.includes(cid) ? null : cid))
    );

    const newCardProgress = { ...(user.cardProgress || {}) };
    const leveledUp: { name: string; oldLv: number; newLv: number }[] = [];

    if (won) {
      for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 3; c++) {
          const pu = board[r]?.[c];
          if (pu && !pu.dead && !lostIds.includes(pu.id)) {
            const currentProg = newCardProgress[pu.id] || { wins: 0, xp: 0, level: 1 };
            const updatedWins = (currentProg.wins || 0) + 1;
            const updatedXp = (currentProg.xp || 0) + 100;
            const prog = calculateCardProgressFromWins(updatedWins);
            const updatedLevel = prog.level;

            if (updatedLevel > (currentProg.level || 1)) {
              leveledUp.push({
                name: pu.name,
                oldLv: currentProg.level || 1,
                newLv: updatedLevel,
              });
            }

            newCardProgress[pu.id] = {
              wins: updatedWins,
              xp: updatedXp,
              level: updatedLevel,
            };
          }
        }
      }
    }

    setLeveledUpCards(leveledUp);

    lostIds.forEach((id) => {
      delete newCardProgress[id];
    });

    let tDelta = 0;
    let promotedLeague: string | null = null;
    const currentTrophies = user.trophies || 150;

    if (battleMode === 'pvp_ranked') {
      tDelta = won ? 30 : -15;
      const newTrophies = Math.max(0, currentTrophies + tDelta);
      const oldLeague = getLeagueByTrophies(currentTrophies);
      const nextLeague = getLeagueByTrophies(newTrophies);
      if (nextLeague.minTrophies > oldLeague.minTrophies) {
        promotedLeague = nextLeague.name;
      }
      setTrophiesDelta(tDelta);
      setPromotedLeagueName(promotedLeague);
    } else {
      setTrophiesDelta(null);
      setPromotedLeagueName(null);
    }

    const finalTrophies = Math.max(0, currentTrophies + tDelta);
    const goldEarned = won ? (stage?.rewardGold || (battleMode === 'pvp_ranked' ? 120 : 60)) : 20;
    const userXpEarned = won ? (stage?.rewardXp || 100) : 20;

    const newPlayerXp = user.xp + userXpEarned;
    const newPlayerLevel = Math.floor(newPlayerXp / 500) + 1;

    let newCampaignIndex = user.campaignCompletedIndex || 0;
    if (won && stage) {
      if (stage.id === 'stage_1') newCampaignIndex = Math.max(newCampaignIndex, 1);
      if (stage.id === 'stage_2') newCampaignIndex = Math.max(newCampaignIndex, 2);
      if (stage.id === 'stage_3') newCampaignIndex = Math.max(newCampaignIndex, 3);
    }

    const updatedUser: UserProfile = {
      ...user,
      gold: user.gold + goldEarned,
      trophies: finalTrophies,
      xp: newPlayerXp,
      level: newPlayerLevel,
      wins: won ? user.wins + 1 : user.wins,
      losses: won ? user.losses : user.losses + 1,
      totalDamage: user.totalDamage + 120,
      unlockedCardIds: newUnlocked,
      activeDeck: newActiveDeck,
      cardProgress: newCardProgress,
      campaignCompletedIndex: newCampaignIndex,
    };

    updateUserProfile(updatedUser);
    onRefreshUser(updatedUser);

    if (won) {
      recordEventWin(user.id);
    }
    if (leveledUp.length > 0) {
      recordEventLevelUp(user.id, leveledUp.length);
    }
  };

  const handleSurrender = () => {
    setSurrenderModalOpen(false);
    if (gameOver) return;
    addLog('شما تسلیم شدید.', '#ff1744');
    sound.play('defeat');
    handleFinalizeBattle(false);
    onBattleEnd();
  };

  useEffect(() => {
    if (turn === 'player' && gameOver === null) {
      setTurnTimeLeft(60);
    }
  }, [turn, turnCount, gameOver]);

  useEffect(() => {
    if (turn !== 'player' || gameOver !== null || isBusy) {
      return;
    }
    const interval = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          addLog('مهلت نوبت به پایان رسید.', '#ff8a80');
          handleEndTurn();
          return 0;
        }
        if (prev === 10) {
          sound.play('hit');
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [turn, gameOver, isBusy]);

  if (missingKingError) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-stone-950 text-stone-100">
        <div className="w-full max-w-md bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95">
          <div className="text-5xl">👑</div>
          <h2 className="text-xl font-black text-rose-400">کارت پادشاه الزامی است!</h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            برای ورود به میدان نبرد باید حداقل یک کارت از نوع پادشاه (King) در خانه مرکزی ردیف شاه چیده شده باشد.
          </p>
          <button
            onClick={onGoToDeck}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3 rounded-xl shadow-lg transition"
          >
            رفتن به چیدمان ارتش 👈
          </button>
          <button
            onClick={onBattleEnd}
            className="text-xs text-stone-400 hover:text-stone-200"
          >
            بازگشت به منوی اصلی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      className={`relative w-full flex-1 flex flex-col items-center justify-between p-2 select-none overflow-hidden ${
        screenShaking ? 'board-shake' : ''
      }`}
      style={{
        backgroundColor: config.bgColor || '#120b08',
        backgroundImage: `url(${config.bgImage || GAME_VISUALS.battleArenaBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Combat Bar */}
      <div className="w-full max-w-md flex items-center justify-between bg-stone-950/90 border border-stone-800 rounded-2xl px-3 py-2 z-20 text-xs shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          {battleMode === 'pvp_ranked' && opponentProfile ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚔️</span>
              <span className="text-rose-300 font-black truncate max-w-[120px]">
                {opponentProfile.displayName}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                🏆 {opponentProfile.trophies || 150}
              </span>
            </div>
          ) : battleMode === 'pvp_friendly' && opponentProfile ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🤝</span>
              <span className="text-cyan-300 font-black truncate max-w-[140px]">
                دوئل دوستانه: {opponentProfile.displayName}
              </span>
            </div>
          ) : battleMode === 'bot' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🤖</span>
              <span className="text-emerald-300 font-black text-[11px]">
                هوش مصنوعی ({botDifficulty === 'easy' ? 'ساده' : botDifficulty === 'hard' ? 'سخت' : botDifficulty === 'nightmare' ? 'کابوس' : 'معمولی'})
              </span>
            </div>
          ) : (
            <span className="text-amber-400 font-black truncate max-w-[150px]">
              {stage ? stage.title : config.titleText || 'میدان رزم'}
            </span>
          )}
          <span className="text-[10px] text-stone-500">دور {turnCount}</span>
        </div>

        <div className="flex items-center gap-2">
          {turn === 'player' && !gameOver && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-black border transition ${
                turnTimeLeft <= 10
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse ring-1 ring-rose-500'
                  : turnTimeLeft <= 20
                  ? 'bg-orange-950 text-orange-300 border-orange-500'
                  : 'bg-stone-900 text-amber-300 border-stone-700'
              }`}
              title="زمان باقی‌مانده نوبت شما"
            >
              <span>⏱️</span>
              <span className="font-mono">{turnTimeLeft}s</span>
            </div>
          )}

          <span
            className={`font-black px-2 py-0.5 rounded text-[11px] ${
              turn === 'player'
                ? 'bg-amber-500 text-stone-950 animate-pulse'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {turn === 'player' ? 'نوبت شما' : 'نوبت حریف'}
          </span>

          {!gameOver && (
            <button
              onClick={() => setSurrenderModalOpen(true)}
              className="bg-rose-950 hover:bg-rose-900 border border-rose-700 hover:border-rose-500 text-rose-300 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition active:scale-95 shadow flex items-center gap-1 cursor-pointer"
              title="تسلیم شدن"
            >
              <span>🏳️</span>
              <span>تسلیم</span>
            </button>
          )}
        </div>
      </div>

      {/* Battlefield Grid */}
      <div className="relative w-full max-w-sm sm:max-w-md flex flex-col justify-around flex-1 my-1 px-1">
        {/* Enemy Side (3x3) */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="text-[9px] text-stone-400 text-center tracking-widest uppercase">
            صفوف نیروهای دشمن
          </div>
          {[0, 1, 2].map((r) => (
            <div key={`erow-${r}`} className="flex justify-center gap-2 sm:gap-3">
              {[0, 1, 2].map((c) => {
                const card = board[r]?.[c];
                return (
                  <div
                    key={`slot-${r}-${c}`}
                    id={`slot-${r}-${c}`}
                    className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-black/40 border-2 border-dashed border-stone-700/60 flex items-center justify-center relative shadow-inner"
                  >
                    {card && (
                      <CardView
                        card={card}
                        currentHealth={card.currentHealth}
                        currentAttack={card.currentAttack}
                        maxHealth={card.maxHealth}
                        cardLevel={card.cardLevel}
                        shield={card.shield}
                        thorns={card.thorns}
                        poison={card.poison}
                        burn={card.burn}
                        dodge={card.dodge}
                        taunt={card.taunt}
                        isFrozen={card.frozen}
                        isSilenced={card.silenced}
                        isDying={card.dead}
                        onClick={() => handleCardClick(r, c)}
                        onHold={() => {
                          sound.play('select');
                          setInspectCard(card);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Divider Line */}
        <div className="my-1 flex items-center justify-center gap-2">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
          <span className="text-amber-400 text-xs font-bold drop-shadow">
            {config.dividerText || '⚔️ مرز نبرد اساطیر ⚔️'}
          </span>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        </div>

        {/* Player Side (3x3) */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {[3, 4, 5].map((r) => (
            <div key={`prow-${r}`} className="flex justify-center gap-2 sm:gap-3">
              {[0, 1, 2].map((c) => {
                const card = board[r]?.[c];
                const isSelected = selectedCardPos?.[0] === r && selectedCardPos?.[1] === c;
                return (
                  <div
                    key={`slot-${r}-${c}`}
                    id={`slot-${r}-${c}`}
                    className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-black/40 border-2 border-dashed border-stone-700/60 flex items-center justify-center relative shadow-inner"
                  >
                    {card && (
                      <CardView
                        card={card}
                        currentHealth={card.currentHealth}
                        currentAttack={card.currentAttack}
                        maxHealth={card.maxHealth}
                        cardLevel={card.cardLevel}
                        shield={card.shield}
                        thorns={card.thorns}
                        poison={card.poison}
                        burn={card.burn}
                        dodge={card.dodge}
                        taunt={card.taunt}
                        isFrozen={card.frozen}
                        isSilenced={card.silenced}
                        isDying={card.dead}
                        canAttack={turn === 'player' && !card.hasAttacked && !card.frozen}
                        isSelected={isSelected}
                        onClick={() => handleCardClick(r, c)}
                        onHold={() => {
                          sound.play('select');
                          setInspectCard(card);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="text-[9px] text-stone-400 text-center tracking-widest uppercase">
            صفوف نیروهای شما
          </div>
        </div>
      </div>

      {/* Floating Damage & Buff Texts */}
      {damageFloats.map((f) => (
        <div
          key={f.id}
          className="damage-float"
          style={{
            left: `${f.x}px`,
            top: `${f.y}px`,
            color: f.color,
          }}
        >
          {f.text}
        </div>
      ))}

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 z-20">
        <div className="text-[11px] text-amber-200/80 truncate">
          {selectedCardPos
            ? 'یک کارت دشمن را برای حمله لمس کنید'
            : 'کارت خود را برای حمله انتخاب کنید'}
        </div>
        <button
          onClick={handleEndTurn}
          disabled={turn !== 'player' || isBusy || gameOver !== null}
          style={{
            backgroundColor: config.endTurnBtnBg || '#ffb300',
            color: config.endTurnBtnColor || '#000000',
          }}
          className="hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-xl border border-amber-300 transition transform active:scale-95 whitespace-nowrap flex items-center gap-2 cursor-pointer"
        >
          <img src={GAME_VISUALS.duelSwordsIcon} alt="End Turn" className="w-5 h-5 rounded-full object-cover shadow" />
          <span>{config.endTurnBtnText || 'پایان نوبت'}</span>
          {turn === 'player' && !gameOver && (
            <span className="bg-black/30 px-2 py-0.5 rounded-lg text-xs font-mono">
              {turnTimeLeft}s
            </span>
          )}
        </button>
      </div>

      {/* Combat Log */}
      <div className="w-full max-w-md bg-stone-950/80 border border-stone-800 rounded-xl p-2 mt-1 text-[10px] text-stone-300 max-h-16 overflow-y-auto leading-relaxed z-10">
        {combatLogs.map((log) => (
          <div key={log.id} style={{ color: log.color || '#d7ccc8' }}>
            {log.text}
          </div>
        ))}
      </div>

      {/* Surrender Confirmation Modal */}
      {surrenderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-stone-900 border-2 border-rose-600 rounded-3xl p-5 text-center flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-4xl">🏳️</div>
            <h3 className="text-lg font-black text-rose-400">آیا قصد تسلیم شدن دارید؟</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              با تسلیم شدن، این مسابقه با شکست ثبت شده و کارت‌های نابودشده به دست آمده از بین می‌روند.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSurrender}
                className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
              >
                بله، تسلیم می‌شوم
              </button>
              <button
                onClick={() => setSurrenderModalOpen(false)}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs py-2.5 rounded-xl border border-stone-700 transition cursor-pointer"
              >
                انصراف و ادامه نبرد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal (for normal battle finish) */}
      {gameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 text-center shadow-2xl flex flex-col gap-3.5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl">
              <img
                src={gameOver === 'victory' ? GAME_VISUALS.trophyEventsIcon : GAME_VISUALS.duelSwordsIcon}
                alt="Status"
                className="w-full h-full object-cover"
              />
            </div>
            <h2
              className={`text-2xl font-black ${
                gameOver === 'victory' ? 'text-amber-400 drop-shadow' : 'text-rose-500 drop-shadow'
              }`}
            >
              {gameOver === 'victory' ? 'پیروزی باشکوه!' : 'شکست در نبرد'}
            </h2>
            <p className="text-xs text-stone-300">
              {gameOver === 'victory'
                ? 'شما دشمنان را در هم کوبیدید!'
                : 'نیروهای شما در این نبرد مغلوب شدند.'}
            </p>

            {lostCardNames.length > 0 ? (
              <div className="bg-rose-950/90 border border-rose-600 rounded-2xl p-2.5 text-xs text-rose-200">
                <span className="font-bold block mb-1">کارت‌های از دست رفته:</span>
                <span className="text-[11px] text-rose-300">
                  {lostCardNames.join(' ، ')} (از دست رفتند)
                </span>
              </div>
            ) : (
              <div className="bg-emerald-950/80 border border-emerald-700 rounded-2xl p-2.5 text-xs text-emerald-300 font-bold">
                هیچ کارتی از دست نرفت! تمام نیروها سالم ماندند.
              </div>
            )}

            {leveledUpCards.length > 0 && (
              <div className="bg-amber-950/70 border border-amber-500/80 rounded-2xl p-2.5 text-xs text-amber-200">
                <span className="font-bold block mb-1">⭐ ارتقای سطح کارت‌ها:</span>
                {leveledUpCards.map((c, i) => (
                  <div key={i} className="text-[11px]">
                    کارت {c.name}: ارتقا به <b>سطح {c.newLv}</b> (+{c.newLv - 1}% قدرت و جان)
                  </div>
                ))}
              </div>
            )}

            {trophiesDelta !== null && (
              <div
                className={`rounded-2xl p-2.5 border text-xs text-center font-bold ${
                  trophiesDelta > 0
                    ? 'bg-amber-950/70 border-amber-500/80 text-amber-300'
                    : 'bg-rose-950/70 border-rose-600 text-rose-300'
                }`}
              >
                <span>تغییرات کاپ: </span>
                <b className="text-sm">
                  {trophiesDelta > 0 ? `+${trophiesDelta}` : trophiesDelta} کاپ 🏆
                </b>
                {promotedLeagueName && (
                  <div className="text-amber-300 font-black text-xs mt-1 animate-pulse">
                    🌟 صعود به لیگ {promotedLeagueName}!
                  </div>
                )}
              </div>
            )}

            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3 text-xs text-stone-300 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-3.5 h-3.5 rounded-full" />
                  <span>سکه طلای دریافتی:</span>
                </span>
                <span className="font-bold text-amber-300">
                  +{gameOver === 'victory' ? stage?.rewardGold || (battleMode === 'pvp_ranked' ? 120 : 60) : 20}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <img src={GAME_VISUALS.gemIcon} alt="XP" className="w-3.5 h-3.5 rounded-full" />
                  <span>تجربه (XP) کسب شده:</span>
                </span>
                <span className="font-bold text-cyan-300">
                  +{gameOver === 'victory' ? stage?.rewardXp || 100 : 20}
                </span>
              </div>
            </div>

            <button
              onClick={onBattleEnd}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black py-3 rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
            >
              <img src={GAME_VISUALS.crownRankIcon} alt="Return" className="w-4 h-4 rounded-full" />
              <span>ادامه و بازگشت</span>
            </button>
          </div>
        </div>
      )}

      {inspectCard && (
        <CardDetailsModal
          card={inspectCard}
          currentHealth={inspectCard.currentHealth}
          currentAttack={inspectCard.currentAttack}
          maxHealth={inspectCard.maxHealth}
          cardLevel={inspectCard.cardLevel}
          shield={inspectCard.shield}
          thorns={inspectCard.thorns}
          poison={inspectCard.poison}
          burn={inspectCard.burn}
          dodge={inspectCard.dodge}
          taunt={inspectCard.taunt}
          isFrozen={inspectCard.frozen}
          isSilenced={inspectCard.silenced}
          onClose={() => setInspectCard(null)}
        />
      )}
    </div>
  );
};
