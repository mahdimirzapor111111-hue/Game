import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  CardDef,
  GameEvent,
} from '../types/game';
import {
  loadEvents,
  loadAllUsers,
  getActiveUser,
  getEventLeaderboard,
  getEventTimeRemaining,
  getEventUserScore,
  checkAndDistributeEndedEvents,
} from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS } from '../assets/visuals';

interface EventsScreenProps {
  user: UserProfile;
  cardLibrary: CardDef[];
  onGoToBattle?: () => void;
  onGoToDeck?: () => void;
  onOpenGifts?: () => void;
  onUserUpdate: (u: UserProfile) => void;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({
  user,
  onGoToBattle,
  onGoToDeck,
  onOpenGifts,
  onUserUpdate,
}) => {
  const [events, setEvents] = useState<GameEvent[]>(() => loadEvents());
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    const list = loadEvents();
    return list[0]?.id || '';
  });
  const [filterTab, setFilterTab] = useState<'all' | 'weekly' | 'monthly' | 'wins' | 'level_ups'>('all');
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => loadAllUsers());
  const [, setTick] = useState<number>(0);
  const [claimNotice] = useState<string | null>(null);

  useEffect(() => {
    const checkAndSync = () => {
      const { settledEvents, totalGiftsSent } = checkAndDistributeEndedEvents();
      if (settledEvents.length > 0 || totalGiftsSent > 0) {
        const freshUser = getActiveUser();
        if (freshUser) {
          onUserUpdate(freshUser);
        }
        refreshData();
      }
      setTick((t) => t + 1);
    };

    checkAndSync();
    const interval = setInterval(checkAndSync, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setEvents(loadEvents());
    setAllUsers(loadAllUsers());
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const filteredEvents = events.filter((ev) => {
    if (filterTab === 'weekly') return ev.period === 'weekly';
    if (filterTab === 'monthly') return ev.period === 'monthly';
    if (filterTab === 'wins') return ev.goalType === 'most_wins';
    if (filterTab === 'level_ups') return ev.goalType === 'most_level_ups';
    return true;
  });

  const timeRemaining = selectedEvent ? getEventTimeRemaining(selectedEvent) : null;
  const leaderboard = selectedEvent ? getEventLeaderboard(selectedEvent, allUsers) : [];
  const myEntry = selectedEvent ? leaderboard.find((item) => item.user.id === user.id) : null;
  const myScore = selectedEvent ? getEventUserScore(user, selectedEvent) : 0;

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-3 sm:p-5 select-none bg-stone-950 text-stone-100 overflow-y-auto pb-24">
      <div className="w-full max-w-5xl flex flex-col gap-5">
        {/* ================= TOURNAMENT ARENA HERO BANNER ================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <img
            src={GAME_VISUALS.tourneyArenaBanner}
            alt="Tournament Arena"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/85 via-stone-950/75 to-purple-950/85 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-2xl shrink-0 bg-stone-900 ring-4 ring-amber-500/30">
              <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-amber-200 drop-shadow">
                  میدان مسابقات و جام‌های اساطیری شاهنامه
                </h1>
                <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow border border-rose-400 animate-pulse flex items-center gap-1">
                  <span>⚡</span>
                  <span>مسابقات زنده</span>
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed drop-shadow">
                در جام‌های هفتگی و ماراتن‌های ماهانه شرکت کنید؛ با هر پیروزی امتیاز بگیرید و جوایز طلایی و کارت‌های خداگونه کسب کنید!
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2.5 w-full md:w-auto justify-end">
            {onGoToBattle && (
              <button
                onClick={() => {
                  sound.play('click');
                  onGoToBattle();
                }}
                className="flex-1 md:flex-none bg-gradient-to-r from-rose-600 via-amber-500 to-amber-600 hover:from-rose-500 text-stone-950 font-black px-5 py-3 rounded-2xl text-xs transition shadow-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-amber-300"
              >
                <img src={GAME_VISUALS.duelSwordsIcon} alt="Swords" className="w-5 h-5 rounded-full object-cover shadow" />
                <span>ورود مستقیم به مسابقه ⚔️</span>
              </button>
            )}
            {onGoToDeck && (
              <button
                onClick={() => {
                  sound.play('click');
                  onGoToDeck();
                }}
                className="flex-1 md:flex-none bg-stone-900/90 hover:bg-stone-800 border border-amber-500/50 text-amber-300 font-black px-4 py-3 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer backdrop-blur"
              >
                <img src={GAME_VISUALS.deckSwordsIcon} alt="Deck" className="w-4 h-4 rounded-full object-cover" />
                <span>تقویت ارتش</span>
              </button>
            )}
          </div>
        </div>

        {claimNotice && (
          <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs sm:text-sm p-4 rounded-2xl text-center shadow-lg font-bold animate-in fade-in flex items-center justify-center gap-2">
            <span>✨</span>
            <span>{claimNotice}</span>
          </div>
        )}

        {/* Filter Pills with Visual Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all' as const, label: 'همه رویدادها', iconImg: GAME_VISUALS.trophyEventsIcon },
            { id: 'weekly' as const, label: 'جام‌های هفتگی', iconImg: GAME_VISUALS.crownRankIcon },
            { id: 'monthly' as const, label: 'ماراتن ماهانه', iconImg: GAME_VISUALS.shopChestBanner },
            { id: 'wins' as const, label: 'بیشترین برد', iconImg: GAME_VISUALS.duelSwordsIcon },
            { id: 'level_ups' as const, label: 'بیشترین ارتقا', iconImg: GAME_VISUALS.forgeEditorIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.play('click');
                setFilterTab(tab.id);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20 border border-amber-400'
                  : 'bg-stone-900/90 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <img src={tab.iconImg} alt="Filter" className="w-4 h-4 rounded-full object-cover" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Event List Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredEvents.map((ev) => {
            const isSelected = ev.id === selectedEventId;
            return (
              <button
                key={ev.id}
                onClick={() => {
                  sound.play('click');
                  setSelectedEventId(ev.id);
                }}
                className={`p-4 rounded-3xl border text-right transition flex items-center gap-3.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 shadow">
                  {ev.icon || '🏆'}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs sm:text-sm text-amber-200 truncate">{ev.title}</h3>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                      {ev.period === 'weekly' ? 'هفتگی' : 'ماهانه'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 truncate">{ev.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Event Details & Leaderboard */}
        {selectedEvent && (
          <div className="flex flex-col gap-5 mt-1">
            <div className="bg-stone-900/90 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-stone-950 border-2 border-amber-400/80 flex items-center justify-center text-4xl sm:text-5xl shadow-inner shrink-0">
                  {selectedEvent.icon || '🏆'}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-xl font-black text-amber-200">
                      {selectedEvent.title}
                    </h2>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <img src={GAME_VISUALS.crownRankIcon} alt="Crown" className="w-3 h-3 rounded-full" />
                      <span>{selectedEvent.period === 'weekly' ? 'هفتگی' : 'ماهانه'}</span>
                    </span>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <img src={GAME_VISUALS.duelSwordsIcon} alt="Goal" className="w-3 h-3 rounded-full" />
                      <span>هدف رقابت: {selectedEvent.goalType === 'most_wins' ? 'بیشترین پیروزی در PvP' : 'بیشترین ارتقای کارت'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
                    {selectedEvent.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-xs text-stone-400">
                    <span>زمان باقی‌مانده تا تسویه جوایز:</span>
                    <div className="flex items-center gap-1 font-mono text-amber-300 font-bold bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 shadow-inner">
                      <span>{timeRemaining?.days} روز</span>
                      <span>:</span>
                      <span>{String(timeRemaining?.hours || 0).padStart(2, '0')}</span>
                      <span>:</span>
                      <span>{String(timeRemaining?.minutes || 0).padStart(2, '0')}</span>
                      <span>:</span>
                      <span>{String(timeRemaining?.seconds || 0).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Standing */}
              <div className="bg-stone-950/85 border border-stone-800 rounded-3xl p-4 flex flex-col justify-between gap-3 min-w-[240px] shadow-lg">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                  <span className="text-xs text-stone-400">جایگاه شما در این رویداد:</span>
                  <div className="flex items-center gap-1.5">
                    <UserAvatar avatar={user.avatar} size="xs" />
                    <span className="text-xs font-bold text-stone-200">{user.displayName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-stone-900/90 p-2 rounded-2xl border border-stone-800 shadow-inner">
                    <span className="text-[10px] text-stone-400 block">امتیاز ثبت‌شده:</span>
                    <span className="text-base font-black text-amber-300">
                      {myScore}{' '}
                      <span className="text-[10px] font-normal text-stone-400">
                        {selectedEvent.goalType === 'most_wins' ? 'برد' : 'ارتقا'}
                      </span>
                    </span>
                  </div>
                  <div className="bg-stone-900/90 p-2 rounded-2xl border border-stone-800 shadow-inner">
                    <span className="text-[10px] text-stone-400 block">رتبه در جدول:</span>
                    <span className="text-base font-black text-cyan-300">
                      {myEntry ? `رتبه ${myEntry.rank}` : 'ثبت نشده'}
                    </span>
                  </div>
                </div>

                {onOpenGifts && (
                  <button
                    onClick={() => {
                      sound.play('click');
                      onOpenGifts();
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black py-2.5 px-3 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-300"
                  >
                    <img src={GAME_VISUALS.shopChestBanner} alt="Gift Box" className="w-5 h-5 rounded-full object-cover" />
                    <span>مشاهده صندوق هدایا و جوایز 🎁</span>
                  </button>
                )}
              </div>
            </div>

            {/* Rewards Showcase */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <img src={GAME_VISUALS.trophyEventsIcon} alt="Reward" className="w-5 h-5 rounded-full" />
                  <span>جوایز باشکوه رتبه‌های برتر {selectedEvent.title}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedEvent.rewards.map((tier, idx) => {
                  const isFirst = tier.rankFrom === 1 && tier.rankTo === 1;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 shadow ${
                        isFirst
                          ? 'bg-gradient-to-b from-amber-950/60 to-stone-900 border-amber-400 ring-1 ring-amber-400/40'
                          : 'bg-stone-950/80 border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                          {isFirst ? (
                            <>
                              <img src={GAME_VISUALS.crownRankIcon} alt="First" className="w-4 h-4 rounded-full" />
                              <span>رتبه اول (قهرمان)</span>
                            </>
                          ) : (
                            <span>🏅 رتبه {tier.rankFrom} تا {tier.rankTo}</span>
                          )}
                        </span>
                        {tier.titleBadge && (
                          <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full">
                            {tier.titleBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs bg-stone-900/90 px-2.5 py-1.5 rounded-xl border border-stone-800">
                          <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                            <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-3.5 h-3.5 rounded-full" />
                            <span>سکه طلا</span>
                          </span>
                          <span className="font-black text-amber-400">
                            {tier.gold?.toLocaleString('fa-IR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-stone-900/90 px-2.5 py-1.5 rounded-xl border border-stone-800">
                          <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                            <img src={GAME_VISUALS.gemIcon} alt="Gems" className="w-3.5 h-3.5 rounded-full" />
                            <span>الماس</span>
                          </span>
                          <span className="font-black text-cyan-400">{tier.gems}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Leaderboard Table */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <img src={GAME_VISUALS.crownRankIcon} alt="Rank" className="w-5 h-5 rounded-full" />
                  <span>جدول رتبه‌بندی زنده و برترین‌های مسابقه</span>
                </h3>
                <span className="text-xs text-stone-400 font-bold">
                  {leaderboard.length} شرکت‌کننده
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {leaderboard.map((entry) => {
                  const isMe = entry.user.id === user.id;

                  return (
                    <div
                      key={entry.user.id}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isMe
                          ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                          : entry.rank === 1
                          ? 'bg-amber-950/20 border-amber-500/60'
                          : 'bg-stone-950/70 border-stone-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            entry.rank === 1
                              ? 'bg-amber-500 text-stone-950 shadow ring-2 ring-amber-300'
                              : entry.rank === 2
                              ? 'bg-slate-300 text-stone-950'
                              : entry.rank === 3
                              ? 'bg-amber-700 text-amber-100'
                              : 'bg-stone-900 text-stone-400 border border-stone-800'
                          }`}
                        >
                          {entry.rank === 1 ? (
                            <img src={GAME_VISUALS.crownRankIcon} alt="Rank 1" className="w-6 h-6 rounded-full" />
                          ) : (
                            <span>#{entry.rank}</span>
                          )}
                        </div>
                        <UserAvatar avatar={entry.user.avatar} size="sm" />
                        <div className="space-y-0.5 text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs sm:text-sm text-stone-100">
                              {entry.user.displayName}
                            </span>
                            {isMe && (
                              <span className="bg-amber-500 text-stone-950 font-black text-[9px] px-1.5 py-0.2 rounded-full">
                                شما
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-left">
                        <div className="text-right flex items-center gap-1.5">
                          <img src={GAME_VISUALS.trophyEventsIcon} alt="Score" className="w-4 h-4 rounded-full" />
                          <span className="text-xs sm:text-sm font-black text-amber-300 block">
                            {entry.score}{' '}
                            <span className="text-[10px] text-stone-400 font-normal">
                              {selectedEvent.goalType === 'most_wins' ? 'برد' : 'ارتقا'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
