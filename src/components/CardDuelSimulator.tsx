import React, { useState, useEffect, useRef } from 'react';
import { CardDef } from '../types/game';
import { CardView } from './CardView';
import { sound } from '../services/audio';

interface CardDuelSimulatorProps {
  playerCard: CardDef;
  cardLibrary: CardDef[];
  onClose: () => void;
}

const DUMMY_OPPONENTS: CardDef[] = [
  {
    id: 'dummy_pehlavan',
    name: 'پهلوان سنگین‌زره',
    type: 'defender',
    tier: 'medium',
    attack: 15,
    health: 45,
    icon: '🛡️',
    borderColor: '#1565c0',
    passives: {
      doubleStrike: false,
      cleave: false,
      crit: 20,
      resurrect: 0,
      lastStand: true,
      regen: 2,
      berserk: 0,
      rage: 0,
      pierce: false,
      ignoreGuard: false,
      stealth: false,
    },
    abilities: {
      onStart: [],
      onTurnStart: [],
      onAttack: [],
      onDefend: [
        {
          id: 'ab_dummy_thorns',
          action: 'thorns',
          label: 'پاتک خارداری',
          icon: '🌵',
          amount: 4,
          targetSide: 'ally',
          positions: [[0, 0]],
        },
      ],
      onKill: [],
      onDeath: [],
    },
  },
  {
    id: 'dummy_div',
    name: 'دیو شاخدار دوزخ',
    type: 'attacker',
    tier: 'legendary',
    attack: 28,
    health: 60,
    icon: '👹',
    borderColor: '#b71c1c',
    aura: 'fire',
    passives: {
      doubleStrike: true,
      cleave: true,
      crit: 30,
      resurrect: 40,
      lastStand: false,
      regen: 0,
      berserk: 3,
      rage: 1,
      pierce: true,
      ignoreGuard: false,
      stealth: false,
    },
    abilities: {
      onStart: [],
      onTurnStart: [],
      onAttack: [],
      onDefend: [],
      onKill: [],
      onDeath: [],
    },
  },
];

export const CardDuelSimulator: React.FC<CardDuelSimulatorProps> = ({
  playerCard,
  cardLibrary,
  onClose,
}) => {
  const [selectedOpponent, setSelectedOpponent] = useState<CardDef>(DUMMY_OPPONENTS[0]);
  const [simTurn, setSimTurn] = useState<number>(1);
  const [playerHp, setPlayerHp] = useState<number>(playerCard.health);
  const [playerAtk, setPlayerAtk] = useState<number>(playerCard.attack);
  const [oppHp, setOppHp] = useState<number>(selectedOpponent.health);
  const [oppAtk, setOppAtk] = useState<number>(selectedOpponent.attack);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [winner, setWinner] = useState<'player' | 'opp' | 'draw' | null>(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [activeAttacker, setActiveAttacker] = useState<'player' | 'opp' | null>(null);
  const autoSimRef = useRef<any>(null);

  // Reset duel when cards change
  const resetDuel = (opp: CardDef = selectedOpponent) => {
    setSelectedOpponent(opp);
    setSimTurn(1);
    setPlayerHp(playerCard.health);
    setPlayerAtk(playerCard.attack);
    setOppHp(opp.health);
    setOppAtk(opp.attack);
    setWinner(null);
    setCombatLogs([`میدان شبیه‌ساز دوئل آماده شد: ${playerCard.name} در برابر ${opp.name}`]);
    setIsAutoSimulating(false);
    if (autoSimRef.current) clearInterval(autoSimRef.current);
    sound.play('select');
  };

  useEffect(() => {
    resetDuel(selectedOpponent);
    return () => {
      if (autoSimRef.current) clearInterval(autoSimRef.current);
    };
  }, [playerCard]);

  const addLog = (text: string) => {
    setCombatLogs((prev) => [text, ...prev.slice(0, 40)]);
  };

  const executeRound = () => {
    if (winner) return;

    // Player attacks Opponent
    setActiveAttacker('player');
    if (playerCard.sounds?.attack) {
      try {
        new Audio(playerCard.sounds.attack).play().catch(() => {});
      } catch {}
    } else {
      sound.play('attack');
    }

    let pDamage = playerAtk;
    // Check Crit
    if (playerCard.passives?.crit && Math.random() * 100 < Number(playerCard.passives.crit)) {
      pDamage *= 2;
      sound.play('crit');
      addLog(`ضربه بحرانی (Critical)! کارت ${playerCard.name} دوبرابر آسیب (${pDamage}) وارد کرد!`);
    }

    const nextOppHp = Math.max(0, oppHp - pDamage);
    setOppHp(nextOppHp);
    addLog(`کارت ${playerCard.name} به ${selectedOpponent.name} مقدار ${pDamage} آسیب زد.`);

    // Check Thorns on opponent
    if (selectedOpponent.abilities?.onDefend?.some((a) => a.action === 'thorns')) {
      const thornsVal = 4;
      setPlayerHp((prev) => Math.max(0, prev - thornsVal));
      sound.play('thorns');
      addLog(`خار دفاعی ${selectedOpponent.name} به ${playerCard.name} مقدار ${thornsVal} ضربه برگشتی زد!`);
    }

    if (nextOppHp <= 0) {
      // Check Resurrect
      if (selectedOpponent.passives?.resurrect && Math.random() < 0.8) {
        const revHp = Math.round(selectedOpponent.health * (Number(selectedOpponent.passives.resurrect) / 100));
        setOppHp(revHp);
        sound.play('revive');
        addLog(`کارت ${selectedOpponent.name} با رستاخیز با ${revHp} جان زنده شد!`);
      } else {
        setWinner('player');
        sound.play('victory');
        addLog(`کارت ${playerCard.name} پیروز دوئل شد!`);
        setIsAutoSimulating(false);
        if (autoSimRef.current) clearInterval(autoSimRef.current);
        return;
      }
    }

    // Opponent counter-attacks after delay
    setTimeout(() => {
      setActiveAttacker('opp');
      sound.play('slash');
      let oDamage = oppAtk;
      if (selectedOpponent.passives?.crit && Math.random() * 100 < Number(selectedOpponent.passives.crit)) {
        oDamage *= 2;
        sound.play('crit');
        addLog(`حریف ضربه بحرانی (${oDamage}) وارد کرد!`);
      }

      setPlayerHp((currHp) => {
        const nextHp = Math.max(0, currHp - oDamage);
        addLog(`حریف ${selectedOpponent.name} مقدار ${oDamage} آسیب به ${playerCard.name} زد.`);
        if (nextHp <= 0) {
          if (playerCard.passives?.lastStand) {
            sound.play('shield');
            addLog(`کارت ${playerCard.name} با جان سخت زنده ماند!`);
            return 1;
          }
          if (playerCard.sounds?.death) {
            try {
              new Audio(playerCard.sounds.death).play().catch(() => {});
            } catch {}
          } else {
            sound.play('death');
          }
          setWinner('opp');
          sound.play('defeat');
          addLog(`کارت ${playerCard.name} شکست خورد!`);
          setIsAutoSimulating(false);
          if (autoSimRef.current) clearInterval(autoSimRef.current);
          return 0;
        }
        return nextHp;
      });

      // Passive Berserk on player
      if (playerCard.passives?.berserk) {
        const bonus = Number(playerCard.passives.berserk) || 2;
        setPlayerAtk((curr) => curr + bonus);
        sound.play('ability');
        addLog(`خشم نبرد کارت ${playerCard.name} فعال شد: +${bonus} قدرت حمله!`);
      }

      setSimTurn((t) => t + 1);
      setTimeout(() => setActiveAttacker(null), 300);
    }, 450);
  };

  const toggleAutoSim = () => {
    if (isAutoSimulating) {
      setIsAutoSimulating(false);
      if (autoSimRef.current) clearInterval(autoSimRef.current);
    } else {
      setIsAutoSimulating(true);
      autoSimRef.current = setInterval(() => {
        executeRound();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="w-full max-w-3xl bg-stone-900 border-2 border-amber-500 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <div>
              <h3 className="text-base font-black text-amber-300">
                میدان شبیه‌ساز تست دوئل ۱ به ۱
              </h3>
              <p className="text-[11px] text-stone-400">
                عملکرد کارت طراحی‌شده را در یک مبارزه واقعی رودررو بیازمایید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Opponent Selector */}
        <div className="flex items-center gap-2 bg-stone-950 p-2.5 rounded-2xl border border-stone-800 text-xs">
          <span className="text-stone-400 font-bold shrink-0">حریف تستی:</span>
          <div className="flex gap-1.5 overflow-x-auto py-1">
            {DUMMY_OPPONENTS.map((opp) => (
              <button
                key={opp.id}
                onClick={() => resetDuel(opp)}
                className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer border ${
                  selectedOpponent.id === opp.id
                    ? 'bg-amber-500 text-stone-950 border-amber-300 shadow'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                }`}
              >
                {opp.icon} {opp.name}
              </button>
            ))}
            {cardLibrary.slice(0, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => resetDuel(c)}
                className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer border ${
                  selectedOpponent.id === c.id
                    ? 'bg-amber-500 text-stone-950 border-amber-300 shadow'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Duel Arena Visualizer */}
        <div className="grid grid-cols-2 gap-4 bg-gradient-to-b from-stone-950 to-stone-900 p-5 rounded-3xl border border-stone-800 relative overflow-hidden">
          {/* Player Side */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-black text-amber-300 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-600/60">
              کارت شما (ادیتور)
            </span>
            <div className={`transition-transform duration-200 ${activeAttacker === 'player' ? 'scale-110 -translate-y-2' : ''}`}>
              <CardView
                card={{ ...playerCard, attack: playerAtk, health: playerHp }}
                currentAttack={playerAtk}
                currentHealth={playerHp}
                maxHealth={playerCard.health}
              />
            </div>
            {/* Stats Bar */}
            <div className="w-full max-w-[160px] bg-stone-950 p-2 rounded-xl border border-stone-800 text-center">
              <div className="flex justify-between text-xs font-black">
                <span className="text-rose-400">⚔️ {playerAtk}</span>
                <span className="text-emerald-400">❤️ {playerHp}/{playerCard.health}</span>
              </div>
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (playerHp / Math.max(1, playerCard.health)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Opponent Side */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-black text-rose-300 bg-rose-950/80 px-3 py-1 rounded-xl border border-rose-600/60">
              حریف آزمایشی
            </span>
            <div className={`transition-transform duration-200 ${activeAttacker === 'opp' ? 'scale-110 -translate-y-2' : ''}`}>
              <CardView
                card={{ ...selectedOpponent, attack: oppAtk, health: oppHp }}
                currentAttack={oppAtk}
                currentHealth={oppHp}
                maxHealth={selectedOpponent.health}
              />
            </div>
            {/* Stats Bar */}
            <div className="w-full max-w-[160px] bg-stone-950 p-2 rounded-xl border border-stone-800 text-center">
              <div className="flex justify-between text-xs font-black">
                <span className="text-rose-400">⚔️ {oppAtk}</span>
                <span className="text-emerald-400">❤️ {oppHp}/{selectedOpponent.health}</span>
              </div>
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (oppHp / Math.max(1, selectedOpponent.health)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center VS Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]">
              VS
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={executeRound}
              disabled={!!winner}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 disabled:opacity-30 text-stone-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              نوبت حمله {simTurn} ⚔️
            </button>
            <button
              onClick={toggleAutoSim}
              disabled={!!winner}
              className={`font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer ${
                isAutoSimulating
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
              }`}
            >
              {isAutoSimulating ? 'توقف شبیه‌ساز ⏸️' : 'شبیه‌سازی خودکار 🤖'}
            </button>
          </div>

          <button
            onClick={() => resetDuel()}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold px-3 py-2 rounded-xl border border-stone-700 transition cursor-pointer"
          >
            شروع مجدد 🔄
          </button>
        </div>

        {/* Combat Logs Console */}
        <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col gap-1.5 h-36 overflow-y-auto text-xs font-mono">
          <span className="text-amber-400 font-bold text-[11px] pb-1 border-b border-stone-800 block">
            گزارش رویدادهای دوئل:
          </span>
          {combatLogs.map((log, idx) => (
            <div key={idx} className="text-stone-300 text-[11px] leading-relaxed">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
