import React, { useState, useEffect } from 'react';
import { UserProfile, CardDef, ShopPageConfig, ChestConfig } from '../types/game';
import { CardView } from './CardView';
import {
  updateUserProfile,
  getCardScaledStats,
  loadChestConfigs,
  pickCardByChestRates,
} from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface ShopScreenProps {
  user: UserProfile;
  cardLibrary: CardDef[];
  config: ShopPageConfig;
  onUserUpdate: (u: UserProfile) => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  user,
  cardLibrary,
  config,
  onUserUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'packs' | 'cards'>('packs');
  const [chests, setChests] = useState<ChestConfig[]>(() => loadChestConfigs());
  const [openingPack, setOpeningPack] = useState<boolean>(false);
  const [openedChest, setOpenedChest] = useState<ChestConfig | null>(null);
  const [revealedCards, setRevealedCards] = useState<CardDef[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const getChestImage = (chest: ChestConfig): string => {
    if (chest.image) return chest.image;
    const id = chest.id.toLowerCase();
    const title = chest.title.toLowerCase();
    if (id.includes('bronze') || title.includes('برنز') || title.includes('چوب')) return GAME_VISUALS.chestBronze;
    if (id.includes('silver') || title.includes('نقره') || title.includes('سیمین')) return GAME_VISUALS.chestSilver;
    if (id.includes('royal') || id.includes('gems') || title.includes('سلطنتی') || title.includes('جواهر')) return GAME_VISUALS.chestMythic;
    return GAME_VISUALS.chestGold;
  };

  useEffect(() => {
    setChests(loadChestConfigs());
  }, []);

  const handleBuyPack = (chest: ChestConfig) => {
    const isGems = chest.currency === 'gems';
    const currentBalance = isGems ? user.gems : user.gold;
    if (currentBalance < chest.price) {
      sound.play('hit');
      setMessage(
        isGems
          ? `الماس شما برای خرید این صندوق کافی نیست (${chest.price} الماس نیاز است).`
          : `سکه طلای شما برای خرید این صندوق کافی نیست (${chest.price} سکه طلا نیاز است).`
      );
      return;
    }

    sound.play('coin');
    sound.play('pack_open');
    setMessage(null);
    setOpenedChest(chest);
    setOpeningPack(true);

    const picked: CardDef[] = [];
    for (let i = 0; i < chest.cardCount; i++) {
      const isGuaranteed = i === 0 && !chest.guaranteedTier && chest.guaranteedTier !== 'none';
      const card = pickCardByChestRates(cardLibrary, chest, isGuaranteed);
      picked.push(card);
    }

    const newUnlocked = Array.from(new Set([...user.unlockedCardIds, ...picked.map((c) => c.id)]));
    const updatedUser: UserProfile = {
      ...user,
      gold: isGems ? user.gold : user.gold - chest.price,
      gems: isGems ? user.gems - chest.price : user.gems,
      unlockedCardIds: newUnlocked,
    };
    updateUserProfile(updatedUser);
    onUserUpdate(updatedUser);

    setTimeout(() => {
      setOpeningPack(false);
      setRevealedCards(picked);
      sound.play('victory');
    }, 900);
  };

  const handleBuyCardDirect = (card: CardDef) => {
    const isAlreadyOwned = user.unlockedCardIds.includes(card.id);
    if (isAlreadyOwned) {
      sound.play('hit');
      setMessage(`کارت ${card.name} در ارتش شما وجود دارد.`);
      return;
    }

    const price = card.shopPrice || 350;
    if (user.gold < price) {
      sound.play('hit');
      setMessage(`سکه طلای کافی برای خرید ${card.name} ندارید (${price} طلا نیاز است).`);
      return;
    }

    sound.play('coin');
    setMessage(null);

    const updatedUser: UserProfile = {
      ...user,
      gold: user.gold - price,
      unlockedCardIds: Array.from(new Set([...user.unlockedCardIds, card.id])),
      cardProgress: {
        ...user.cardProgress,
        [card.id]: {
          wins: 0,
          xp: 0,
          level: 1,
        },
      },
    };
    updateUserProfile(updatedUser);
    onUserUpdate(updatedUser);
    setMessage(`کارت ${card.name} با موفقیت خریداری و به ارتش افزوده شد!`);
    setTimeout(() => setMessage(null), 3500);
  };

  const availableChests = chests.filter((c) => c.isAvailable !== false);

  return (
    <div
      className="w-full flex-1 flex flex-col items-center p-3 sm:p-5 overflow-y-auto select-none text-stone-100 pb-24"
      style={{
        backgroundColor: config.bgColor || '#120b08',
        backgroundImage: config.bgImage ? `url(${config.bgImage})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* ================= SHOP HERO BANNER ================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src={GAME_VISUALS.shopChestBanner}
            alt="Shop Chest"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/85 via-stone-950/75 to-purple-950/85 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4 text-center md:text-right">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl shrink-0 bg-stone-900 ring-4 ring-amber-500/30">
              <img src={GAME_VISUALS.shopChestBanner} alt="Chest" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-2xl font-black flex items-center justify-center md:justify-start gap-2 drop-shadow"
                style={{ color: config.titleColor || '#ffd54f' }}
              >
                <span>{config.titleText || 'صندوق‌های اساطیری و کارت‌خانه'}</span>
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed drop-shadow">
                صندوق‌های شانس را بگشایید یا کارت‌های افسانه‌ای و خداگونه را مستقیماً جذب کنید
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 bg-stone-950/90 px-4 py-2.5 rounded-2xl border border-stone-800 backdrop-blur text-xs shadow-lg">
            <div className="flex items-center gap-1.5 text-amber-300 font-black">
              <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-4 h-4 rounded-full" />
              <span>{user.gold} طلا</span>
            </div>
            <span className="text-stone-600">|</span>
            <div className="flex items-center gap-1.5 text-cyan-300 font-black">
              <img src={GAME_VISUALS.gemIcon} alt="Gems" className="w-4 h-4 rounded-full" />
              <span>{user.gems} الماس</span>
            </div>
          </div>
        </div>

        {/* Shopkeeper Banner */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 flex items-center gap-3.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-500/40 shrink-0">
            <img src={GAME_VISUALS.simurgh} alt="Keeper" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-black text-amber-300">{config.shopkeeperName || 'بازرگان کهن اساطیر'}:</span>
            <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
              {config.bannerText || 'بهترین کارت‌های اساطیری ایران‌زمین با ضمانت اصالت و قدرت برای قهرمانان شاهنامه!'}
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-3.5 rounded-2xl text-center shadow animate-in fade-in font-bold flex items-center justify-center gap-2">
            <span>✨</span>
            <span>{message}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-stone-900 p-1.5 rounded-2xl border border-stone-800 gap-1.5">
          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('packs');
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'packs'
                ? 'bg-amber-500 text-stone-950 font-black shadow-lg border border-amber-300'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <img src={GAME_VISUALS.shopChestBanner} alt="Chests" className="w-4 h-4 rounded-full object-cover" />
            <span>صندوق‌های شانس اساطیر 🎁</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('cards');
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'cards'
                ? 'bg-amber-500 text-stone-950 font-black shadow-lg border border-amber-300'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <img src={GAME_VISUALS.deckSwordsIcon} alt="Cards" className="w-4 h-4 rounded-full object-cover" />
            <span>خرید مستقیم قهرمانان ⚔️</span>
          </button>
        </div>

        {/* TAB 1: MYSTERY CHESTS */}
        {activeTab === 'packs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableChests.map((chest) => {
              const isGems = chest.currency === 'gems';
              const rates = chest.tierRates || { normal: 50, medium: 30, legendary: 15, god: 5 };
              const chestImg = getChestImage(chest);

              return (
                <div
                  key={chest.id}
                  className="bg-stone-900/90 border-2 border-stone-800 hover:border-amber-500/70 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-xl transition hover:scale-[1.01]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-950 border-2 border-amber-500/70 flex items-center justify-center shadow-lg shrink-0 group">
                          <img
                            src={chestImg}
                            alt={chest.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-amber-200">
                            {chest.title}
                          </h3>
                          <span className="text-[11px] text-stone-400">
                            حاوی <b>{chest.cardCount}</b> کارت اساطیری
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-base font-black flex items-center gap-1.5 ${isGems ? 'text-cyan-300' : 'text-amber-300'}`}>
                          <img src={isGems ? GAME_VISUALS.gemIcon : GAME_VISUALS.coinIcon} alt="Currency" className="w-4 h-4 rounded-full" />
                          <span>{chest.price} {isGems ? 'الماس' : 'طلا'}</span>
                        </span>
                        {chest.guaranteedTier && chest.guaranteedTier !== 'none' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold mt-1">
                            تضمین: {chest.guaranteedTier === 'god' ? 'خداگونه' : chest.guaranteedTier === 'legendary' ? 'افسانه‌ای' : 'متوسط'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-300 my-2 leading-relaxed">
                      {chest.description}
                    </p>

                    {/* DROP RATE PROBABILITIES DISPLAY */}
                    <div className="bg-stone-950/80 rounded-2xl p-3 border border-stone-800 space-y-1.5 text-xs">
                      <span className="text-[11px] text-stone-400 font-bold block">
                        احتمال دریافت رده‌های مختلف:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                        <div className="bg-stone-900 p-1.5 rounded-xl border border-stone-800">
                          <span className="text-stone-400 block">عادی</span>
                          <b className="text-stone-200">{rates.normal}%</b>
                        </div>
                        <div className="bg-blue-950/60 p-1.5 rounded-xl border border-blue-800">
                          <span className="text-blue-300 block">متوسط</span>
                          <b className="text-blue-200">{rates.medium}%</b>
                        </div>
                        <div className="bg-purple-950/60 p-1.5 rounded-xl border border-purple-800">
                          <span className="text-purple-300 block">افسانه‌ای</span>
                          <b className="text-purple-200">{rates.legendary}%</b>
                        </div>
                        <div className="bg-amber-950/80 p-1.5 rounded-xl border border-amber-600">
                          <span className="text-amber-400 block">خداگونه</span>
                          <b className="text-amber-300">{rates.god}%</b>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyPack(chest)}
                    disabled={openingPack}
                    className={`w-full font-black py-3 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border ${
                      isGems
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-stone-950 border-cyan-300'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 border-amber-300'
                    }`}
                  >
                    <img src={chestImg} alt="Chest" className="w-5 h-5 rounded-md object-cover" />
                    <span>{openingPack && openedChest?.id === chest.id ? 'در حال گشودن صندوق...' : 'باز کردن صندوق'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: DIRECT CARDS STORE */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {cardLibrary.map((card) => {
              const price = card.shopPrice || (card.tier === 'god' ? 1200 : card.tier === 'legendary' ? 650 : card.tier === 'medium' ? 300 : 150);
              const isOwned = user.unlockedCardIds.includes(card.id);
              const cardProg = user.cardProgress?.[card.id];
              const level = cardProg?.level || 1;

              return (
                <div
                  key={card.id}
                  className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/70 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <CardView card={card} cardLevel={isOwned ? level : undefined} compact />
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-black text-amber-300 text-sm">{card.name}</div>
                      <div className="text-[11px] text-stone-300">
                        حمله: <b>{card.attack}</b> | جان: <b>{card.health}</b>
                      </div>
                      {isOwned && (
                        <div className="text-[10px] text-emerald-400 font-bold">
                          ✓ در ارتش شما موجود است
                        </div>
                      )}
                      {card.description && (
                        <div className="text-[10px] text-stone-400 line-clamp-2">
                          {card.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-amber-300 text-sm">
                      <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-4 h-4 rounded-full" />
                      <span>{price} طلا</span>
                    </div>
                    {isOwned ? (
                      <span className="text-[11px] text-stone-400 bg-stone-800 px-3.5 py-1.5 rounded-xl border border-stone-700 font-bold">
                        موجود در کالکشن
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuyCardDirect(card)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-amber-300"
                      >
                        <img src={GAME_VISUALS.coinIcon} alt="Buy" className="w-4 h-4 rounded-full" />
                        <span>خرید کارت 🛒</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Card Reveal Modal */}
        {revealedCards.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-stone-900 border-2 border-amber-400 rounded-3xl p-6 text-center flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl relative group">
                <img
                  src={openedChest ? getChestImage(openedChest) : GAME_VISUALS.chestGold}
                  alt="Chest"
                  className="w-full h-full object-cover animate-pulse"
                />
              </div>
              <h3 className="text-xl font-black text-amber-300">
                تبریک! کارت‌های {openedChest?.title || 'صندوق اساطیری'} به دست آمد:
              </h3>
              <p className="text-xs text-stone-300">
                این کارت‌ها به ارتش شما اضافه شدند و اکنون در دسترس هستند.
              </p>

              <div className="flex gap-3 justify-center py-4 flex-wrap">
                {revealedCards.map((rc, idx) => {
                  const scaled = getCardScaledStats(rc, user.cardProgress?.[rc.id]);
                  return (
                    <div key={`rev-${idx}`} className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                      <CardView card={rc} cardLevel={scaled.level} />
                      <div className="text-xs font-bold text-amber-200 mt-1.5">{rc.name}</div>
                      <span className="text-[9px] text-stone-400">رده: {rc.tier}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setRevealedCards([])}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black py-3 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
              >
                <img src={GAME_VISUALS.crownRankIcon} alt="Accept" className="w-4 h-4 rounded-full" />
                <span>دریافت کارت‌ها و بازگشت</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
