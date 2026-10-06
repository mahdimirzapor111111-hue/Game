import React, { useState, useEffect } from 'react';
import { UserProfile, CardDef, MarketListing } from '../types/game';
import { CardView } from './CardView';
import { UserAvatar } from './UserAvatar';
import { UsdFinanceModal } from './UsdFinanceModal';
import {
  loadMarketListings,
  createMarketListing,
  buyDirectListing,
  bidOnAuction,
  finalizeAuction,
  getCardScaledStats,
} from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface MarketplaceScreenProps {
  user: UserProfile;
  cardLibrary: CardDef[];
  onUserUpdate: (u: UserProfile) => void;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({
  user,
  cardLibrary,
  onUserUpdate,
}) => {
  const [listings, setListings] = useState<MarketListing[]>(() => loadMarketListings());
  const [filterType, setFilterType] = useState<'all' | 'usd' | 'direct' | 'auction' | 'my'>('all');
  const [selectedBidAmount, setSelectedBidAmount] = useState<Record<string, number>>({});

  // Selling modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedCardToSell, setSelectedCardToSell] = useState<CardDef | null>(null);
  const [sellMode, setSellMode] = useState<'direct' | 'auction'>('direct');
  const [sellCurrency, setSellCurrency] = useState<'gold' | 'usd'>('usd');
  const [sellPrice, setSellPrice] = useState<number>(15);

  // USD Finance modal state
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [financeModalTab, setFinanceModalTab] = useState<'deposit' | 'withdraw' | 'chat'>('deposit');

  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setListings(loadMarketListings());
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const formatRemainingTime = (expiresAt: number) => {
    const diff = Math.max(0, expiresAt - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (diff === 0) return 'منقضی شده';
    return `${hours} ساعت و ${mins} دقیقه`;
  };

  const handleBuyDirect = (listing: MarketListing) => {
    sound.play('click');
    setErrorNotice(null);
    const result = buyDirectListing(listing.id, user);
    if (result.success) {
      sound.play('coin');
      const isUsd = listing.currency === 'usd';
      setNotice(
        `کارت ${listing.card.name} با مبلغ ${isUsd ? `$${listing.price} USD` : `${listing.price} سکه`} با موفقیت خریداری شد!`
      );
      setListings(loadMarketListings());
      const freshUser: UserProfile = {
        ...user,
        gold: isUsd ? user.gold : user.gold - listing.price,
        usd: isUsd ? (user.usd || 0) - listing.price : (user.usd || 0),
        unlockedCardIds: Array.from(new Set([...user.unlockedCardIds, listing.card.id])),
      };
      onUserUpdate(freshUser);
      setTimeout(() => setNotice(null), 3500);
    } else {
      sound.play('hit');
      setErrorNotice(result.error || 'خطا در خرید کارت.');
      setTimeout(() => setErrorNotice(null), 3500);
    }
  };

  const handlePlaceBid = (listing: MarketListing) => {
    sound.play('click');
    setErrorNotice(null);
    const isUsd = listing.currency === 'usd';
    const defaultStep = isUsd ? 1 : 50;
    const bid = selectedBidAmount[listing.id] || listing.currentBid + defaultStep;

    const result = bidOnAuction(listing.id, user, bid);
    if (result.success) {
      sound.play('coin');
      setNotice(`پیشنهاد ${isUsd ? `$${bid} USD` : `${bid} سکه`} برای ${listing.card.name} ثبت شد!`);
      setListings(loadMarketListings());
      const freshUser: UserProfile = {
        ...user,
        gold: isUsd ? user.gold : user.gold - bid,
        usd: isUsd ? (user.usd || 0) - bid : (user.usd || 0),
      };
      onUserUpdate(freshUser);
      setTimeout(() => setNotice(null), 3500);
    } else {
      sound.play('hit');
      setErrorNotice(result.error || 'خطا در ثبت پیشنهاد.');
      setTimeout(() => setErrorNotice(null), 3500);
    }
  };

  const handleFinalize = (listing: MarketListing) => {
    sound.play('click');
    const res = finalizeAuction(listing.id);
    setNotice(res.message);
    setListings(loadMarketListings());
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardToSell) return;
    if (sellPrice <= 0) {
      setErrorNotice('قیمت نامعتبر است.');
      return;
    }
    const cardProg = user.cardProgress?.[selectedCardToSell.id];
    const level = cardProg?.level || 1;
    const ok = createMarketListing(user, selectedCardToSell, level, sellMode, sellPrice, sellCurrency);
    if (ok) {
      sound.play('coin');
      const unit = sellCurrency === 'usd' ? '$ USD' : 'سکه';
      setNotice(
        sellMode === 'direct'
          ? `کارت ${selectedCardToSell.name} برای فروش مستقیم به قیمت ${sellPrice} ${unit} در بازارچه قرار گرفت.`
          : `کارت ${selectedCardToSell.name} در مزایده با قیمت پایه ${sellPrice} ${unit} قرار گرفت.`
      );
      setSellModalOpen(false);
      setSelectedCardToSell(null);
      setListings(loadMarketListings());
      const freshUser = {
        ...user,
        unlockedCardIds: user.unlockedCardIds.filter((cid) => cid !== selectedCardToSell.id),
      };
      onUserUpdate(freshUser);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const filtered = listings.filter((l) => {
    if (filterType === 'usd') return l.currency === 'usd' && l.status === 'active';
    if (filterType === 'direct') return l.type === 'direct' && l.status === 'active';
    if (filterType === 'auction') return l.type === 'auction' && l.status === 'active';
    if (filterType === 'my') return l.sellerId === user.id;
    return l.status === 'active';
  });

  const openFinanceTab = (tab: 'deposit' | 'withdraw' | 'chat') => {
    sound.play('click');
    setFinanceModalTab(tab);
    setFinanceModalOpen(true);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center p-3 sm:p-5 overflow-y-auto select-none bg-stone-950 text-stone-100 pb-24">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* ================= BAZAAR HERO BANNER WITH USD INTEGRATION ================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src={GAME_VISUALS.marketBazaarBanner}
            alt="Market Bazaar"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-stone-950/80 to-amber-950/85 pointer-events-none" />

          {/* Left: Branding & Balances */}
          <div className="relative z-10 flex items-center gap-4 text-center md:text-right">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-2xl shrink-0 bg-stone-900 ring-4 ring-emerald-500/30 flex items-center justify-center p-1">
              <img src={GAME_VISUALS.usdIcon} alt="USD Market" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-amber-200 drop-shadow flex items-center justify-center md:justify-start gap-2">
                <span>بازارچه اساطیر و حراج دلاری کارت‌ها</span>
                <span className="text-xs bg-emerald-500 text-stone-950 font-black px-2 py-0.5 rounded-full shadow">
                  💵 معاملات با دلار آمریکا
                </span>
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed drop-shadow">
                خرید و فروش کارت‌ها با دلار واقعی یا سکه، مزایده‌های ۲۴ ساعته و تسویه مستقیم با مدیریت
              </p>

              {/* Player Wallet Balances in Bazaar */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-2.5 text-xs">
                <div
                  onClick={() => openFinanceTab('deposit')}
                  className="bg-emerald-950/90 border border-emerald-500/60 px-3 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-emerald-900 transition shadow"
                  title="کلیک برای شارژ دلار"
                >
                  <img src={GAME_VISUALS.usdIcon} alt="USD" className="w-4 h-4 rounded-full" />
                  <span className="text-stone-300">موجودی دلار:</span>
                  <b className="text-emerald-300 font-black text-sm">${(user.usd || 0).toLocaleString()} USD</b>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-900/60 px-1 rounded">➕ شارژ</span>
                </div>

                <div className="bg-stone-900/90 border border-amber-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow">
                  <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-4 h-4 rounded-full" />
                  <span className="text-stone-300">سکه طلا:</span>
                  <b className="text-amber-300 font-black">{(user.gold || 0).toLocaleString()}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="relative z-10 flex flex-wrap md:flex-col items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => {
                sound.play('click');
                setSellModalOpen(true);
              }}
              className="flex-1 md:w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
            >
              <span>🏷️</span>
              <span>فروش کارت در بازارچه</span>
            </button>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => openFinanceTab('deposit')}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-[11px] px-3 py-2 rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-emerald-400"
              >
                <span>📥</span>
                <span>شارژ دلار (۱۰$+)</span>
              </button>
              <button
                onClick={() => openFinanceTab('withdraw')}
                className="flex-1 bg-amber-700 hover:bg-amber-600 text-white font-black text-[11px] px-3 py-2 rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-amber-400"
              >
                <span>📤</span>
                <span>برداشت (۲۰$+)</span>
              </button>
            </div>

            <button
              onClick={() => openFinanceTab('chat')}
              className="w-full bg-stone-900/90 hover:bg-stone-800 text-cyan-300 font-bold text-[11px] px-3 py-1.5 rounded-xl transition border border-cyan-500/40 cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <span>💬</span>
              <span>چت مستقیم با ادمین (پشتیبانی معامله)</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-3.5 rounded-2xl text-center shadow animate-in fade-in font-bold flex items-center justify-center gap-2">
            <span>✨</span>
            <span>{notice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="bg-rose-950/90 border border-rose-600 text-rose-200 text-xs p-3.5 rounded-2xl text-center shadow animate-in fade-in font-bold flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Filter Navigation Dock */}
        <div className="flex bg-stone-900 p-1.5 rounded-2xl border border-stone-800 gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'همه کالاها', iconImg: GAME_VISUALS.marketScalesIcon },
            { id: 'usd', label: 'معاملات دلاری 💵', iconImg: GAME_VISUALS.usdIcon },
            { id: 'direct', label: 'خرید مستقیم', iconImg: GAME_VISUALS.coinIcon },
            { id: 'auction', label: 'مزایده‌های ۲۴ ساعته', iconImg: GAME_VISUALS.trophyEventsIcon },
            { id: 'my', label: 'کارت‌های من در بازار', iconImg: GAME_VISUALS.deckSwordsIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.play('click');
                setFilterType(tab.id as any);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
                filterType === tab.id
                  ? 'bg-amber-500 text-stone-950 shadow-lg font-black border border-amber-300'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <img src={tab.iconImg} alt="Icon" className="w-4 h-4 rounded-full object-cover" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {filtered.length === 0 ? (
          <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-10 text-center text-stone-400 text-xs flex flex-col items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <p>هیچ کالایی در این دسته‌بندی یافت نشد.</p>
            <button
              onClick={() => setSellModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              اولین کارت خود را با دلار یا سکه عرضه کنید
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const isMine = item.sellerId === user.id;
              const isAuction = item.type === 'auction';
              const isUsd = item.currency === 'usd';
              const cardProg = user.cardProgress?.[item.card.id];
              const displayCard = { ...item.card };

              return (
                <div
                  key={item.id}
                  className={`bg-stone-900/85 border rounded-3xl p-4 flex gap-4 shadow-xl relative transition-all duration-200 hover:border-amber-400/80 ${
                    isUsd
                      ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 via-stone-900 to-stone-950'
                      : 'border-stone-800'
                  }`}
                >
                  {/* Currency Badge */}
                  <div className="absolute top-3 left-3 z-20 flex gap-1 items-center">
                    {isUsd ? (
                      <span className="bg-emerald-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                        <span>💵</span>
                        <span>معامله با دلار</span>
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        🪙 سکه‌ای
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAuction
                          ? 'bg-purple-950 text-purple-300 border border-purple-700'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {isAuction ? 'مزایده' : 'خرید مستقیم'}
                    </span>
                  </div>

                  {/* Card View */}
                  <div className="shrink-0 pt-1">
                    <CardView card={displayCard} cardLevel={item.cardLevel} compact />
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <UserAvatar avatar={item.sellerAvatar} size="xs" />
                        <span className="text-[11px] text-stone-400 font-bold">
                          فروشنده: <b className="text-stone-200">{item.sellerName}</b>
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-amber-300">{item.card.name}</h3>
                      <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                        سطح کارت: <b className="text-amber-400">{item.cardLevel}</b> | رده: {item.card.tier}
                      </p>

                      {isAuction ? (
                        <div className="mt-2 bg-stone-950/80 p-2 rounded-xl border border-stone-800/80 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-stone-400 text-[11px]">پیشنهاد فعلی:</span>
                            <b className={`font-black ${isUsd ? 'text-emerald-400 text-sm' : 'text-amber-400 text-sm'}`}>
                              {isUsd ? `$${item.currentBid} USD` : `${item.currentBid} سکه`}
                            </b>
                          </div>
                          {item.highestBidderName && (
                            <span className="text-[10px] text-stone-400">
                              بالاترین پیشنهاد دهنده: <b className="text-stone-200">{item.highestBidderName}</b>
                            </span>
                          )}
                          <div className="text-[10px] text-stone-500 flex items-center gap-1">
                            <span>⏳</span>
                            <span>{formatRemainingTime(item.expiresAt)}</span>
                            <span>({item.bidsCount} پیشنهاد)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 bg-stone-950/80 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
                          <span className="text-stone-400 text-[11px]">قیمت فروش:</span>
                          <b className={`font-black ${isUsd ? 'text-emerald-400 text-sm' : 'text-amber-400 text-sm'}`}>
                            {isUsd ? `$${item.price} USD` : `${item.price} سکه`}
                          </b>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 pt-2 border-t border-stone-800 flex items-center gap-2">
                      {!isMine && (
                        <>
                          {isAuction ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="number"
                                min={item.currentBid + (isUsd ? 1 : 10)}
                                step={isUsd ? 1 : 50}
                                value={selectedBidAmount[item.id] || item.currentBid + (isUsd ? 1 : 50)}
                                onChange={(e) =>
                                  setSelectedBidAmount({
                                    ...selectedBidAmount,
                                    [item.id]: parseInt(e.target.value) || item.currentBid + (isUsd ? 1 : 10),
                                  })
                                }
                                className="w-20 bg-stone-950 border border-stone-700 rounded-xl px-2 py-1.5 text-xs text-amber-300 font-bold text-center"
                              />
                              <button
                                onClick={() => handlePlaceBid(item)}
                                className={`flex-1 py-1.5 px-3 rounded-xl font-black text-xs transition cursor-pointer shadow ${
                                  isUsd
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                                }`}
                              >
                                ثبت پیشنهاد
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBuyDirect(item)}
                              className={`w-full py-2 px-4 rounded-xl font-black text-xs transition cursor-pointer shadow flex items-center justify-center gap-1.5 ${
                                isUsd
                                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white shadow-emerald-900/50'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950'
                              }`}
                            >
                              <span>خرید نقدی</span>
                              <b>{isUsd ? `$${item.price}` : `${item.price} سکه`}</b>
                            </button>
                          )}
                        </>
                      )}

                      {isMine && (
                        <div className="w-full flex items-center justify-between text-stone-400">
                          <span className="text-[11px] font-bold">🏷️ کارت شما در بازار</span>
                          {isAuction && item.expiresAt <= Date.now() && (
                            <button
                              onClick={() => handleFinalize(item)}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg cursor-pointer"
                            >
                              تسویه مزایده
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= SELL MODAL WITH CURRENCY SELECTION ================= */}
      {sellModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border-2 border-amber-500/70 rounded-3xl p-6 text-stone-100 flex flex-col gap-4 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSellModalOpen(false)}
              className="absolute top-4 left-4 text-stone-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center">
              <h3 className="text-lg font-black text-amber-400 flex items-center justify-center gap-2">
                <img src={GAME_VISUALS.marketScalesIcon} alt="Market" className="w-6 h-6 rounded-full" />
                <span>عرضه کارت در بازارچه و حراجی</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                کارت را انتخاب کنید و واحد پولی دلخواه (دلار آمریکا یا سکه طلا) را مشخص نمایید
              </p>
            </div>

            {/* Choose Card */}
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1.5">
                انتخاب کارت برای فروش ({user.unlockedCardIds.length} کارت موجود):
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-stone-800 no-scrollbar">
                {user.unlockedCardIds.map((cid) => {
                  const card = cardLibrary.find((x) => x.id === cid);
                  if (!card) return null;
                  const isSelected = selectedCardToSell?.id === card.id;
                  const scaled = getCardScaledStats(card, user.cardProgress?.[card.id]);
                  return (
                    <div
                      key={cid}
                      onClick={() => setSelectedCardToSell(card)}
                      className={`cursor-pointer rounded-2xl transition transform shrink-0 ${
                        isSelected ? 'ring-4 ring-amber-400 scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <CardView card={card} cardLevel={scaled.level} compact />
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCardToSell && (
              <form onSubmit={handleCreateListing} className="flex flex-col gap-3.5 text-xs">
                <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                  کارت انتخاب‌شده: <b className="text-amber-300">{selectedCardToSell.name}</b>
                </div>

                {/* Currency Selection: USD vs Gold */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    واحد پولی معامله (Currency):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSellCurrency('usd');
                        if (sellPrice > 50) setSellPrice(15);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
                        sellCurrency === 'usd'
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-md'
                          : 'border-stone-800 bg-stone-950 text-stone-400'
                      }`}
                    >
                      <span>💵</span>
                      <span>دلار آمریکا (USD $)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSellCurrency('gold');
                        if (sellPrice < 50) setSellPrice(350);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
                        sellCurrency === 'gold'
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md'
                          : 'border-stone-800 bg-stone-950 text-stone-400'
                      }`}
                    >
                      <span>🪙</span>
                      <span>سکه طلای بازی</span>
                    </button>
                  </div>
                </div>

                {/* Sell Mode */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    روش فروش:
                  </label>
                  <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800 gap-1">
                    <button
                      type="button"
                      onClick={() => setSellMode('direct')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        sellMode === 'direct' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400'
                      }`}
                    >
                      فروش مستقیم (فوری)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellMode('auction')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        sellMode === 'auction' ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400'
                      }`}
                    >
                      مزایده ۲۴ ساعته
                    </button>
                  </div>
                </div>

                {/* Price input */}
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    {sellCurrency === 'usd'
                      ? sellMode === 'direct'
                        ? 'قیمت فروش (دلار آمریکا $):'
                        : 'قیمت پایه مزایده (دلار آمریکا $):'
                      : sellMode === 'direct'
                      ? 'قیمت فروش (سکه طلا):'
                      : 'قیمت پایه مزایده (سکه طلا):'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={sellCurrency === 'usd' ? 1 : 50}
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-full bg-stone-950 border rounded-xl px-3 py-2.5 text-sm font-black focus:outline-none ${
                      sellCurrency === 'usd'
                        ? 'border-emerald-500 text-emerald-300'
                        : 'border-amber-500 text-amber-300'
                    }`}
                  />
                  {sellCurrency === 'usd' && (
                    <span className="text-[10px] text-emerald-400/80 mt-1 block">
                      💡 پس از فروش، مبلغ دلار مستقیماً به کیف‌پول شما اضافه شده و قابل برداشت نقدی است.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 text-stone-950 font-black py-3 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
                >
                  <img src={sellCurrency === 'usd' ? GAME_VISUALS.usdIcon : GAME_VISUALS.coinIcon} alt="Icon" className="w-5 h-5 rounded-full" />
                  <span>ثبت و انتشار در بازارچه 🏷️</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= USD FINANCE MODAL ================= */}
      <UsdFinanceModal
        isOpen={financeModalOpen}
        onClose={() => setFinanceModalOpen(false)}
        user={user}
        onUserUpdate={onUserUpdate}
        defaultTab={financeModalTab}
      />
    </div>
  );
};
