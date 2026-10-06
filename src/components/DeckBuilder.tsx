import React, { useState } from 'react';
import { UserProfile, CardDef } from '../types/game';
import { CardView } from './CardView';
import { updateUserProfile, getCardScaledStats, recordEventLevelUp } from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface DeckBuilderProps {
  user: UserProfile;
  cardLibrary: CardDef[];
  onUserUpdate: (u: UserProfile) => void;
  onGoToMarket?: () => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  user,
  cardLibrary,
  onUserUpdate,
  onGoToMarket,
}) => {
  const KING_ROW = 2;
  const KING_COL = 1;

  const isKingSlot = (r: number, c: number) => r === KING_ROW && c === KING_COL;
  const isBesideKingSlot = (r: number, c: number) => r === KING_ROW && (c === 0 || c === 2);

  const [deck, setDeck] = useState<(string | null)[][]>(() => {
    let d: (string | null)[][] = Array.from({ length: 3 }, () => Array(3).fill(null));
    if (user.activeDeck && user.activeDeck.length === 3) {
      d = user.activeDeck.map((r) => [...r]);
    }

    let misplacedKingId: string | null = null;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === KING_ROW && c === KING_COL) continue;
        const cid = d[r]?.[c];
        if (cid) {
          const card = cardLibrary.find((x) => x.id === cid);
          if (card?.type === 'king') {
            misplacedKingId = cid;
            d[r][c] = null;
          }
        }
      }
    }

    const centerCardId = d[KING_ROW]?.[KING_COL];
    if (centerCardId) {
      const centerCard = cardLibrary.find((x) => x.id === centerCardId);
      if (centerCard && centerCard.type !== 'king') {
        let moved = false;
        for (let r = 0; r < 3 && !moved; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === KING_ROW && c === KING_COL) continue;
            if (!d[r][c]) {
              d[r][c] = centerCardId;
              moved = true;
              break;
            }
          }
        }
        d[KING_ROW][KING_COL] = null;
      }
    }

    if (!d[KING_ROW][KING_COL]) {
      if (misplacedKingId) {
        d[KING_ROW][KING_COL] = misplacedKingId;
      } else {
        const firstUnlockedKing = cardLibrary.find(
          (c) => c.type === 'king' && (user.unlockedCardIds.includes(c.id) || user.role === 'admin')
        );
        if (firstUnlockedKing) {
          d[KING_ROW][KING_COL] = firstUnlockedKing.id;
        }
      }
    }

    return d;
  });

  const [selectedSlot, setSelectedSlot] = useState<[number, number] | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inspectCard, setInspectCard] = useState<CardDef | null>(null);

  const unlockedCards = cardLibrary.filter(
    (c) => user.unlockedCardIds.includes(c.id) || user.role === 'admin'
  );

  const cardsInDeck = new Set<string>();
  deck.forEach((row) => {
    row.forEach((cid) => {
      if (cid) cardsInDeck.add(cid);
    });
  });

  const kingInReservedSlotId = deck[KING_ROW]?.[KING_COL];
  const kingInReservedSlot = kingInReservedSlotId
    ? cardLibrary.find((c) => c.id === kingInReservedSlotId)
    : null;
  const hasKingInDeck = kingInReservedSlot?.type === 'king';

  const handleSlotClick = (row: number, col: number) => {
    sound.play('select');
    if (selectedSlot && selectedSlot[0] === row && selectedSlot[1] === col) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot([row, col]);
    }
  };

  const handleRemoveFromSlot = (row: number, col: number, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.play('click');
    const newDeck = deck.map((r) => [...r]);
    newDeck[row][col] = null;
    setDeck(newDeck);
  };

  const handleCardSelect = (cardId: string) => {
    if (!selectedSlot) return;
    const [row, col] = selectedSlot;
    const targetCard = cardLibrary.find((c) => c.id === cardId);

    if (isKingSlot(row, col)) {
      if (targetCard?.type !== 'king') {
        sound.play('hit');
        setErrorMessage('در این جایگاه فقط کارت‌های «پادشاه» (King) می‌توانند قرار گیرند.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
    } else {
      if (targetCard?.type === 'king') {
        sound.play('hit');
        setErrorMessage('کارت‌های پادشاه تنها می‌توانند در خانه وسط ردیف ۳ قرار گیرند.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
    }

    const newDeck = deck.map((r) => [...r]);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (newDeck[r][c] === cardId) {
          newDeck[r][c] = null;
        }
      }
    }

    newDeck[row][col] = cardId;
    setDeck(newDeck);
    setSelectedSlot(null);
    setErrorMessage(null);
    sound.play('card_place');
  };

  const handleSave = () => {
    if (!hasKingInDeck) {
      sound.play('hit');
      setErrorMessage('خطا: چیدمان باید حتماً دارای کارت پادشاه در خانه وسط ردیف سوم باشد.');
      return;
    }

    const updatedUser = {
      ...user,
      activeDeck: deck,
    };
    updateUserProfile(updatedUser);
    onUserUpdate(updatedUser);
    sound.play('coin');
    setErrorMessage(null);
    setSavedNotice('ترکیب ارتش با موفقیت ذخیره شد!');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleAutoFill = () => {
    const newDeck = Array.from({ length: 3 }, () => Array(3).fill(null));
    const used = new Set<string>();

    const kings = unlockedCards.filter((c) => c.type === 'king');
    if (kings[0]) {
      newDeck[KING_ROW][KING_COL] = kings[0].id;
      used.add(kings[0].id);
    }

    const magesAndSpells = unlockedCards.filter(
      (c) => (c.type === 'mage' || c.type === 'spell') && !used.has(c.id)
    );
    if (magesAndSpells[0]) {
      newDeck[KING_ROW][0] = magesAndSpells[0].id;
      used.add(magesAndSpells[0].id);
    }
    if (magesAndSpells[1]) {
      newDeck[KING_ROW][2] = magesAndSpells[1].id;
      used.add(magesAndSpells[1].id);
    }

    const defenders = unlockedCards.filter(
      (c) => c.type === 'defender' && !used.has(c.id)
    );
    defenders.slice(0, 3).forEach((d, i) => {
      newDeck[0][i] = d.id;
      used.add(d.id);
    });

    const attackers = unlockedCards.filter(
      (c) => (c.type === 'attacker' || c.type === 'both' || c.type === 'god') && !used.has(c.id)
    );
    attackers.slice(0, 3).forEach((a, i) => {
      newDeck[1][i] = a.id;
      used.add(a.id);
    });

    const remaining = unlockedCards.filter((c) => !used.has(c.id));
    let remIdx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!newDeck[r][c] && remaining[remIdx]) {
          newDeck[r][c] = remaining[remIdx++].id;
        }
      }
    }

    setDeck(newDeck);
    sound.play('select');
    setSavedNotice('چیدمان هوشمند با موفقیت اعمال شد.');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleUpgradeCard = (card: CardDef) => {
    const currentProg = user.cardProgress?.[card.id] || { wins: 0, level: 1, xp: 0 };
    const currentLevel = currentProg.level || 1;
    const goldCost = currentLevel * 150;
    const xpCost = currentLevel * 50;

    if ((user.gold || 0) < goldCost) {
      sound.play('hit');
      alert(`برای ارتقا به ${goldCost} سکه طلا نیاز دارید.`);
      return;
    }
    if ((user.xp || 0) < xpCost) {
      sound.play('hit');
      alert(`تجربه (XP) کافی نیست. به ${xpCost} امتیاز تجربه نیاز دارید.`);
      return;
    }

    const nextLevel = currentLevel + 1;
    const updatedProgress = {
      ...(user.cardProgress || {}),
      [card.id]: {
        ...currentProg,
        level: nextLevel,
        xp: (currentProg.xp || 0) + xpCost,
      },
    };

    const updatedUser: UserProfile = {
      ...user,
      gold: user.gold - goldCost,
      xp: user.xp - xpCost,
      cardProgress: updatedProgress,
    };
    updateUserProfile(updatedUser);
    onUserUpdate(updatedUser);
    recordEventLevelUp(user.id, 1);
    sound.play('victory');
    setSavedNotice(`کارت ${card.name} به سطح ${nextLevel} ارتقا یافت!`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto select-none bg-stone-950 text-stone-100 pb-24">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* ================= WAR ROOM HERO BANNER ================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src={GAME_VISUALS.deckForgeBanner}
            alt="War Room"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/85 via-stone-950/75 to-purple-950/85 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4 text-center md:text-right">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl shrink-0 bg-stone-900 ring-4 ring-amber-500/30">
              <img src={GAME_VISUALS.deckSwordsIcon} alt="Deck" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-amber-200 drop-shadow">
                آرایش و چیدمان ارتش اساطیری
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed drop-shadow">
                ترکیب ۳×۳ ارتش خود را بچینید؛ خانه وسط ردیف ۳ ویژه پادشاه و خانه‌های کناری محافظ جادو هستند
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2.5 w-full md:w-auto justify-center md:justify-end">
            <button
              onClick={handleAutoFill}
              className="bg-stone-900/90 hover:bg-stone-800 text-stone-200 text-xs font-bold px-4 py-2.5 rounded-2xl transition border border-stone-700 cursor-pointer flex items-center gap-1.5 shadow"
            >
              <span>🤖</span>
              <span>چیدمان خودکار</span>
            </button>
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 text-xs font-black px-5 py-2.5 rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer flex items-center gap-2 border border-amber-300"
            >
              <img src={GAME_VISUALS.deckSwordsIcon} alt="Save" className="w-4 h-4 rounded-full object-cover" />
              <span>ذخیره ترکیب 💾</span>
            </button>
          </div>
        </div>

        {/* King Requirement Indicator */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-md ${
            hasKingInDeck
              ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
              : 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{hasKingInDeck ? '👑' : '⚠️'}</span>
            <span>
              {hasKingInDeck
                ? `پادشاه فرمانده ارتش: ${kingInReservedSlot?.name}`
                : 'هشدار: کارت پادشاه (King) در جایگاه مخصوص قرار نگرفته است!'}
            </span>
          </div>
          {!hasKingInDeck && (
            <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-black">
              الزامی برای نبرد
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="bg-rose-950/90 border border-rose-600 text-rose-200 text-xs p-3 rounded-2xl text-center shadow font-bold flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {savedNotice && (
          <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-3 rounded-2xl text-center shadow animate-in fade-in font-bold flex items-center justify-center gap-2">
            <span>✨</span>
            <span>{savedNotice}</span>
          </div>
        )}

        {/* 3x3 Deck Slots */}
        <div className="flex flex-col items-center gap-2 bg-stone-900/80 border border-stone-800 rounded-3xl p-5 shadow-xl">
          <div className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
            <img src={GAME_VISUALS.deckSwordsIcon} alt="Grid" className="w-4 h-4 rounded-full" />
            <span>
              {selectedSlot
                ? `خانه انتخاب‌شده: ردیف ${selectedSlot[0] + 1} - ستون ${selectedSlot[1] + 1} (کارت پایین را لمس کنید)`
                : 'یک خانه را لمس کنید، سپس کارت مورد نظر را از پایین انتخاب نمایید'}
            </span>
          </div>

          {[0, 1, 2].map((r) => {
            const rowLabel =
              r === 0
                ? 'ردیف ۱ (صف مقدم نبرد)'
                : r === 1
                ? 'ردیف ۲ (قلب لشکر)'
                : 'ردیف ۳ (پادشاه و محافظان ویژه)';

            return (
              <div key={`deck-row-${r}`} className="flex flex-col items-center gap-1 w-full">
                <span className="text-[10px] font-bold text-stone-400">{rowLabel}</span>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2].map((c) => {
                    const cardId = deck[r]?.[c];
                    const rawCard = cardLibrary.find((x) => x.id === cardId);
                    const scaled = rawCard
                      ? getCardScaledStats(rawCard, user.cardProgress?.[rawCard.id])
                      : null;
                    const card = rawCard && scaled
                      ? { ...rawCard, attack: scaled.attack, health: scaled.health }
                      : rawCard;

                    const isSelected = selectedSlot?.[0] === r && selectedSlot?.[1] === c;
                    const isTheKingSlot = r === KING_ROW && c === KING_COL;
                    const isBesideKing = isBesideKingSlot(r, c);

                    return (
                      <div
                        key={`deck-slot-${r}-${c}`}
                        onClick={() => handleSlotClick(r, c)}
                        className={`w-18 h-26 sm:w-22 sm:h-30 rounded-2xl flex items-center justify-center relative cursor-pointer transition ${
                          isTheKingSlot
                            ? isSelected
                              ? 'border-2 border-amber-300 ring-4 ring-amber-400 bg-amber-950/70 scale-105 shadow-xl'
                              : 'border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/40 to-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-400'
                            : isBesideKing
                            ? isSelected
                              ? 'border-2 border-purple-300 ring-4 ring-purple-400 bg-purple-950/70 scale-105 shadow-xl'
                              : 'border-2 border-purple-500/70 bg-gradient-to-b from-purple-950/40 to-stone-950 shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:border-purple-400'
                            : isSelected
                            ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 bg-stone-950/90 scale-105'
                            : 'border-2 border-dashed border-stone-700 bg-stone-950/90 hover:border-amber-500/60'
                        }`}
                      >
                        {isTheKingSlot && (
                          <div className="absolute -top-2.5 inset-x-0.5 text-center bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-[8px] sm:text-[9px] rounded-full py-0.5 shadow-md z-20 pointer-events-none">
                            👑 جایگاه اختصاصی پادشاه
                          </div>
                        )}
                        {isBesideKing && (
                          <div className="absolute -top-2.5 inset-x-0.5 text-center bg-gradient-to-r from-purple-800 to-indigo-800 text-purple-200 border border-purple-500/50 font-black text-[7px] sm:text-[8px] rounded-full py-0.2 shadow-md z-20 pointer-events-none">
                            🔮 محافظ / جادو
                          </div>
                        )}

                        {card ? (
                          <>
                            <CardView
                              card={card}
                              cardLevel={scaled?.level}
                              compact
                              onHold={() => {
                                sound.play('select');
                                if (rawCard) setInspectCard(rawCard);
                              }}
                            />
                            <button
                              onClick={(e) => handleRemoveFromSlot(r, c, e)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center shadow font-bold z-20 cursor-pointer"
                              title="حذف از چیدمان"
                            >
                              ✕
                            </button>
                          </>
                        ) : isTheKingSlot ? (
                          <div className="flex flex-col items-center justify-center p-1.5 text-center gap-0.5">
                            <span className="text-xl sm:text-2xl drop-shadow animate-bounce">👑</span>
                            <span className="text-[9px] font-black text-amber-300">پادشاه</span>
                            <span className="text-[7px] text-amber-500/80">برای نبرد الزامی است</span>
                          </div>
                        ) : isBesideKing ? (
                          <div className="flex flex-col items-center justify-center p-1.5 text-center gap-0.5">
                            <span className="text-xl sm:text-2xl drop-shadow">🧙</span>
                            <span className="text-[9px] font-black text-purple-300">جادوگر/پاسدار</span>
                            <span className="text-[7px] text-purple-400/80">حمایت از شاه</span>
                          </div>
                        ) : (
                          <div className="text-center p-2 text-stone-600 hover:text-stone-400">
                            <span className="text-xl block">+</span>
                            <span className="text-[9px]">خالی</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unlocked Cards Collection */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5 border-b border-stone-800 pb-2.5">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <img src={GAME_VISUALS.deckSwordsIcon} alt="Collection" className="w-4 h-4 rounded-full" />
              <span>مجموعه کارت‌های شما ({unlockedCards.length} کارت)</span>
            </h3>
            <span className="text-xs text-stone-400">
              {selectedSlot && isKingSlot(selectedSlot[0], selectedSlot[1])
                ? 'فقط کارت‌های نوع پادشاه قابل انتخاب هستند'
                : 'برای جاگذاری در خانه انتخاب‌شده لمس کنید'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center sm:justify-start">
            {unlockedCards.map((rawCard) => {
              const inDeck = cardsInDeck.has(rawCard.id);
              const scaled = getCardScaledStats(rawCard, user.cardProgress?.[rawCard.id]);
              const card = { ...rawCard, attack: scaled.attack, health: scaled.health };
              const isKing = rawCard.type === 'king';
              const isKingSlotSelected = selectedSlot?.[0] === KING_ROW && selectedSlot?.[1] === KING_COL;
              const isOtherSlotSelected = selectedSlot !== null && !isKingSlotSelected;

              let cardStyle = inDeck
                ? 'opacity-85 ring-2 ring-amber-500/70 rounded-xl'
                : 'hover:scale-105';

              let badge = null;
              if (isKing) {
                badge = (
                  <div className="absolute -top-1.5 inset-x-1 bg-amber-500 text-stone-950 font-black text-[7px] text-center rounded-full py-0.2 shadow z-10">
                    👑 پادشاه
                  </div>
                );
                if (isKingSlotSelected) {
                  cardStyle = 'ring-4 ring-amber-400 scale-105 rounded-xl shadow-lg';
                } else if (isOtherSlotSelected) {
                  cardStyle = 'opacity-40 cursor-not-allowed';
                }
              }

              return (
                <div
                  key={`unlocked-${card.id}`}
                  onClick={() => handleCardSelect(card.id)}
                  className={`relative transform transition cursor-pointer ${cardStyle}`}
                >
                  <CardView
                    card={card}
                    cardLevel={scaled.level}
                    compact
                    onHold={() => {
                      sound.play('select');
                      setInspectCard(rawCard);
                    }}
                  />
                  {badge}
                  {inDeck && (
                    <div className="absolute -bottom-1 inset-x-0 bg-amber-500 text-stone-950 font-black text-[8px] text-center rounded-b py-0.5 shadow">
                      در ترکیب
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inspect & Level-Up Modal */}
      {inspectCard && (
        <div
          onClick={() => setInspectCard(null)}
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-900 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-6 max-w-md w-full flex flex-col items-center gap-4 text-center shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between w-full border-b border-stone-800 pb-2">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <img src={GAME_VISUALS.forgeEditorIcon} alt="Upgrade" className="w-4 h-4 rounded-full" />
                <span>جزئیات و ارتقای کارت</span>
              </span>
              <button
                onClick={() => setInspectCard(null)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const currentProg = user.cardProgress?.[inspectCard.id] || { wins: 0, level: 1, xp: 0 };
              const currentLevel = currentProg.level || 1;
              const scaled = getCardScaledStats(inspectCard, currentProg);
              const goldCost = currentLevel * 150;
              const xpCost = currentLevel * 50;
              const canAfford = (user.gold || 0) >= goldCost && (user.xp || 0) >= xpCost;

              return (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="transform scale-110 py-2">
                    <CardView
                      card={{ ...inspectCard, attack: scaled.attack, health: scaled.health }}
                      cardLevel={currentLevel}
                    />
                  </div>

                  <div className="w-full bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-stone-300">
                      <span>سطح فعلی:</span>
                      <span className="font-black text-amber-400">سطح {currentLevel}</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-300">
                      <span>پیروزی‌های ثبت شده:</span>
                      <span className="font-bold text-stone-200">{currentProg.wins || 0} برد</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-300">
                      <span>قدرت و جان با ارتقا:</span>
                      <span className="font-bold text-emerald-400">
                        حمله {scaled.attack + 2} | جان {scaled.health + 3}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-around gap-2 text-[11px]">
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-4 h-4 rounded-full" />
                        <span>هزینه طلا: {goldCost}</span>
                      </span>
                      <span className="text-purple-300 font-bold flex items-center gap-1.5">
                        <img src={GAME_VISUALS.gemIcon} alt="XP" className="w-4 h-4 rounded-full" />
                        <span>تجربه لازم: {xpCost}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpgradeCard(inspectCard)}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-2xl font-black text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 active:scale-95 shadow-amber-500/20 border border-amber-300'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    }`}
                  >
                    <img src={GAME_VISUALS.forgeEditorIcon} alt="Upgrade" className="w-4 h-4 rounded-full" />
                    <span>ارتقا به سطح {currentLevel + 1} (+قدرت و جان)</span>
                  </button>

                  {onGoToMarket && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.play('click');
                        setInspectCard(null);
                        onGoToMarket();
                      }}
                      className="w-full py-2.5 rounded-2xl font-black text-xs transition shadow bg-stone-950 hover:bg-stone-800 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>💵</span>
                      <span>عرضه و فروش این کارت در بازارچه (با دلار آمریکا $ یا سکه)</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
