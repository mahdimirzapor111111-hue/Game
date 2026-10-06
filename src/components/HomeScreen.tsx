import React, { useState } from 'react';
import {
  UserProfile,
  CardDef,
  BattleMode,
  BotDifficulty,
  LEAGUES,
  getLeagueByTrophies,
} from '../types/game';
import { loadAllUsers, loadClans, loadEvents, getEventTimeRemaining } from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS } from '../assets/visuals';

interface HomeScreenProps {
  user: UserProfile;
  cardLibrary: CardDef[];
  onStartBattle: (params: {
    mode: BattleMode;
    opponent?: UserProfile | null;
    difficulty?: BotDifficulty;
  }) => void;
  onOpenCampaign: () => void;
  onOpenDeck: () => void;
  onOpenLeaderboard: () => void;
  onOpenClan?: () => void;
  onOpenProfile?: () => void;
  onOpenEvents?: () => void;
  onOpenGifts?: () => void;
  onOpenGlobalChat?: () => void;
  onOpenTutorial?: () => void;
  onUserUpdate: (u: UserProfile) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onStartBattle,
  onOpenCampaign,
  onOpenDeck: _onOpenDeck,
  onOpenLeaderboard,
  onOpenClan,
  onOpenProfile,
  onOpenEvents,
  onOpenGifts,
  onOpenGlobalChat,
  onOpenTutorial,
}) => {
  const [matchmakingModal, setMatchmakingModal] = useState<boolean>(false);
  const [friendlyModal, setFriendlyModal] = useState<boolean>(false);
  const [botModal, setBotModal] = useState<boolean>(false);
  const [selectedBotDiff, setSelectedBotDiff] = useState<BotDifficulty>('normal');

  // Matchmaking state
  const [searching, setSearching] = useState<boolean>(false);
  const [matchedOpponent, setMatchedOpponent] = useState<UserProfile | null>(null);

  // Friendly match state
  const [friendlyTab, setFriendlyTab] = useState<'list' | 'room'>('list');
  const [roomCode] = useState<string>('7492');
  const [inputRoomCode, setInputRoomCode] = useState<string>('');

  const allUsers = loadAllUsers();
  const allClans = loadClans();
  const userClan = user.clanId ? allClans.find((c) => c.id === user.clanId) : null;
  const currentLeague = getLeagueByTrophies(user.trophies || 150);

  // Next league calculation
  const currentLeagueIdx = LEAGUES.findIndex((l) => l.id === currentLeague.id);
  const nextLeague =
    currentLeagueIdx < LEAGUES.length - 1 ? LEAGUES[currentLeagueIdx + 1] : null;

  const currentTrophies = user.trophies || 150;
  const trophiesInCurrentLeague = currentTrophies - currentLeague.minTrophies;
  const leagueSpan = nextLeague
    ? nextLeague.minTrophies - currentLeague.minTrophies
    : 1000;
  const leagueProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((trophiesInCurrentLeague / Math.max(1, leagueSpan)) * 100))
  );

  const sortedByTrophies = [...allUsers].sort(
    (a, b) => (b.trophies || 150) - (a.trophies || 150) || b.wins - a.wins
  );
  const userRankIndex = sortedByTrophies.findIndex((u) => u.id === user.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : sortedByTrophies.length + 1;
  const topPlayers = sortedByTrophies.slice(0, 3);
  const otherPlayers = allUsers.filter((u) => u.id !== user.id);

  // 1. RANKED MATCHMAKING FLOW
  const handleStartRankedMatchmaking = () => {
    sound.play('click');
    setMatchmakingModal(true);
    setSearching(true);
    setMatchedOpponent(null);

    setTimeout(() => {
      let pool = otherPlayers;
      if (pool.length === 0) pool = allUsers;
      const sorted = [...pool].sort(
        (a, b) =>
          Math.abs((a.trophies || 150) - currentTrophies) -
          Math.abs((b.trophies || 150) - currentTrophies)
      );
      const candidate = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
      setSearching(false);
      setMatchedOpponent(candidate);
      sound.play('victory');
    }, 1600);
  };

  const handleConfirmRankedBattle = () => {
    if (!matchedOpponent) return;
    sound.play('select');
    setMatchmakingModal(false);
    onStartBattle({
      mode: 'pvp_ranked',
      opponent: matchedOpponent,
    });
  };

  // 2. FRIENDLY MATCH FLOW
  const handleSelectFriendlyOpponent = (targetUser: UserProfile) => {
    sound.play('select');
    setFriendlyModal(false);
    onStartBattle({
      mode: 'pvp_friendly',
      opponent: targetUser,
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    sound.play('select');
    const opp = otherPlayers[0] || allUsers[0];
    setFriendlyModal(false);
    onStartBattle({
      mode: 'pvp_friendly',
      opponent: opp,
    });
  };

  // 3. BOT MATCH FLOW
  const handleConfirmBotBattle = () => {
    sound.play('select');
    setBotModal(false);
    onStartBattle({
      mode: 'bot',
      difficulty: selectedBotDiff,
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center p-3 sm:p-5 overflow-y-auto select-none text-stone-100 pb-24">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* ================= HERO PLAYER RANK & LEAGUE BANNER ================= */}
        <div
          className={`relative rounded-3xl p-4 sm:p-5 border-2 shadow-2xl overflow-hidden ${currentLeague.badgeBg} ${currentLeague.borderColor}`}
        >
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* League Badge & User Info */}
            <div className="flex items-center gap-3.5 text-center sm:text-right">
              <div
                onClick={onOpenProfile}
                className="relative cursor-pointer hover:opacity-90 transition active:scale-95"
                title="مشاهده پروفایل کاربری"
              >
                <UserAvatar
                  avatar={user.avatar}
                  size="lg"
                  className="border-2 border-amber-400 shadow-xl"
                  crownRank={userRank <= 10 ? userRank : undefined}
                />
                <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full text-[9px] font-black bg-stone-950 text-amber-300 border border-stone-700 shadow">
                  سطح {user.level}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2
                    onClick={onOpenProfile}
                    className="text-lg sm:text-xl font-black text-amber-300 hover:text-amber-200 cursor-pointer"
                  >
                    {user.displayName}
                  </h2>
                  {user.title && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
                      {user.title}
                    </span>
                  )}
                  <span className="text-[10px] bg-stone-900 text-stone-300 px-2 py-0.5 rounded-full border border-stone-700 font-bold">
                    سطح {user.level}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className={`text-sm sm:text-base font-black ${currentLeague.color} flex items-center gap-1`}>
                    <span>{currentLeague.icon}</span>
                    <span>{currentLeague.name}</span>
                  </span>
                  <span className="text-xs text-stone-300 font-bold flex items-center gap-1">
                    <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                    <span>کاپ رنکد: <b>{currentTrophies}</b></span>
                  </span>
                  {userClan ? (
                    <span
                      onClick={onOpenClan}
                      className="bg-purple-950/90 text-purple-200 border border-purple-500/50 px-2.5 py-0.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-purple-900 transition flex items-center gap-1.5 shadow"
                    >
                      <img src={GAME_VISUALS.clanShieldIcon} alt="Clan" className="w-3.5 h-3.5 rounded-full" />
                      <span>{userClan.name}</span>
                      <span className="text-[10px] text-amber-300">
                        ({user.clanRole === 'sultan' ? 'سلطان' : user.clanRole === 'elder' ? 'بزرگ‌تر' : 'عضو'})
                      </span>
                    </span>
                  ) : onOpenClan ? (
                    <button
                      onClick={onOpenClan}
                      className="bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-200 px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <img src={GAME_VISUALS.clanShieldIcon} alt="Clan" className="w-3.5 h-3.5 rounded-full" />
                      <span>عضویت در اتحادیه</span>
                    </button>
                  ) : null}
                </div>

                {user.bio ? (
                  <p className="text-[11px] text-stone-300 italic max-w-sm hidden sm:block">
                    "{user.bio}"
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-400 max-w-sm hidden sm:block">
                    {currentLeague.description}
                  </p>
                )}
              </div>
            </div>

            {/* League Progress Bar & Next Tier */}
            <div className="w-full sm:w-64 bg-stone-950/70 border border-stone-800/90 rounded-2xl p-3 flex flex-col gap-2 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">صعود به لیگ بعدی:</span>
                {nextLeague ? (
                  <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                    <span>{nextLeague.name} {nextLeague.icon}</span>
                    <span>{nextLeague.minTrophies - currentTrophies} کاپ</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold text-[11px]">
                    بالاترین لیگ اساطیری 🌟
                  </span>
                )}
              </div>
              <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800 relative">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-500 shadow-sm"
                  style={{ width: `${leagueProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>{currentLeague.minTrophies} 🏆</span>
                <span className="text-amber-400 font-bold">{currentTrophies} 🏆</span>
                <span>{nextLeague ? nextLeague.minTrophies : 'ماکزیمم'} 🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TUTORIAL & GLOBAL CHAT QUICK LAUNCH ROW ================= */}
        <div className={`grid gap-3 ${!user.completedTutorial ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {!user.completedTutorial && (
            <div
              onClick={() => {
                sound.play('click');
                if (onOpenTutorial) onOpenTutorial();
              }}
              className="bg-gradient-to-r from-cyan-950/90 via-stone-900 to-blue-950/90 border-2 border-cyan-500/60 hover:border-cyan-400 rounded-3xl p-3.5 shadow-xl flex items-center justify-between gap-3 cursor-pointer group transition transform active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 p-0.5 shadow-lg flex items-center justify-center text-stone-950 font-black text-2xl shrink-0">
                  🎓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-cyan-200 text-xs sm:text-sm">
                      آموزش کامل بازی برای دلاوران نوپا
                    </h4>
                    {!user.hasClaimedTutorialReward && (
                      <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow animate-pulse">
                        پاداش شروع 🎁
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    آموزش گام‌به‌گام مبارزه، ارتقای ارتش (افزایش ۱۰٪ در هر برد)، لیگ‌ها و بازارچه
                  </p>
                </div>
              </div>
              <span className="text-cyan-400 font-black text-sm group-hover:translate-x-[-4px] transition-transform">
                ◀
              </span>
            </div>
          )}

          <div
            onClick={() => {
              sound.play('click');
              if (onOpenGlobalChat) onOpenGlobalChat();
            }}
            className="bg-gradient-to-r from-amber-950/90 via-stone-900 to-yellow-950/90 border-2 border-amber-500/60 hover:border-amber-400 rounded-3xl p-3.5 shadow-xl flex items-center justify-between gap-3 cursor-pointer group transition transform active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 p-0.5 shadow-lg flex items-center justify-center text-stone-950 font-black text-2xl shrink-0">
                💬
              </div>
              <div>
                <h4 className="font-black text-amber-200 text-xs sm:text-sm flex items-center gap-2">
                  <span>تالار چت همگانی و بین کلن‌ها</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                    آنلاین
                  </span>
                </h4>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  گفتگوی زنده با تمام بازیکنان، دیپلماسی کلن‌ها و چالش دوئل
                </p>
              </div>
            </div>
            <span className="text-amber-400 font-black text-sm group-hover:translate-x-[-4px] transition-transform">
              ◀
            </span>
          </div>
        </div>

        {/* ================= UNCLAIMED GIFTS BANNER ================= */}
        {user.gifts && user.gifts.some((g) => !g.claimed) && (
          <div
            onClick={() => {
              sound.play('click');
              if (onOpenGifts) onOpenGifts();
            }}
            className="bg-gradient-to-r from-purple-950 via-amber-950/70 to-purple-950 border-2 border-amber-400 rounded-3xl p-3.5 sm:p-4 shadow-xl flex items-center justify-between gap-3 cursor-pointer group hover:border-amber-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0">
                <img src={GAME_VISUALS.shopChestBanner} alt="Gifts" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-black text-amber-300 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>هدایا و جوایز دریافت‌نشده!</span>
                  <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow">
                    {user.gifts.filter((g) => !g.claimed).length} مورد
                  </span>
                </h4>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  جوایز مسابقات و هدایای مدیریتی برای شما ارسال شده است.
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.play('click');
                if (onOpenGifts) onOpenGifts();
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg shrink-0 transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300"
            >
              <span>باز کردن</span>
              <span>👈</span>
            </button>
          </div>
        )}

        {/* ================= EVENTS SPOTLIGHT BANNER ================= */}
        {(() => {
          const eventsList = loadEvents().filter((e) => e.isActive);
          const activeWeekly = eventsList.find((e) => e.period === 'weekly');
          const activeMonthly = eventsList.find((e) => e.period === 'monthly');
          const primaryEvent = activeWeekly || activeMonthly || eventsList[0];
          if (!primaryEvent) return null;
          const tr = getEventTimeRemaining(primaryEvent);
          return (
            <div
              onClick={() => {
                sound.play('click');
                if (onOpenEvents) onOpenEvents();
              }}
              className="bg-gradient-to-r from-stone-900 via-amber-950/50 to-stone-900 border-2 border-amber-500/60 hover:border-amber-400 rounded-3xl p-4 sm:p-5 shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl group-hover:scale-105 transition-transform shrink-0">
                  <img src={GAME_VISUALS.tourneyArenaBanner} alt="Tournament" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow animate-pulse">
                      رویداد زنده
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-2 py-0.5 rounded-full">
                      {primaryEvent.period === 'weekly' ? 'هفتگی' : 'ماهانه'}
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-amber-200 group-hover:text-amber-300 transition">
                      {primaryEvent.title}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 line-clamp-1">
                    {primaryEvent.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-stone-800 pt-2 md:pt-0">
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block">زمان باقی‌مانده:</span>
                  <span className="font-mono font-black text-amber-300 text-xs">
                    {tr.isExpired
                      ? 'پایان یافته'
                      : `${tr.days} روز و ${String(tr.hours).padStart(2, '0')}:${String(
                          tr.minutes
                        ).padStart(2, '0')}:${String(tr.seconds).padStart(2, '0')}`}
                  </span>
                </div>
                <button className="bg-gradient-to-r from-amber-500 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 text-stone-950 font-black px-4 py-2 rounded-xl text-xs transition shadow flex items-center gap-1 cursor-pointer border border-amber-300">
                  <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                  <span>مشاهده جوایز</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ================= BATTLE MODES GRID ================= */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <img src={GAME_VISUALS.duelSwordsIcon} alt="Battle" className="w-4 h-4 rounded-full" />
              <span>حالت‌های نبرد اساطیری</span>
            </h3>
            <span className="text-[11px] text-stone-400">یک حالت را برای ورود به میدان انتخاب کنید</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. RANKED PVP */}
            <div
              onClick={handleStartRankedMatchmaking}
              className="group relative bg-gradient-to-br from-stone-900 via-amber-950/40 to-stone-900 border-2 border-amber-500/70 hover:border-amber-400 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xl transition-all duration-200 cursor-pointer active:scale-98 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-inner shrink-0">
                    <img src={GAME_VISUALS.duelSwordsIcon} alt="Ranked" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-black text-amber-200 group-hover:text-amber-300 transition">
                        نبرد رده‌بندی رنکد PvP
                      </h4>
                      <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full shadow">
                        اصلی
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-0.5">
                      پیدا کردن حریف هم‌کاپ و صعود به لیگ‌های بالاتر شاهنامه
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold whitespace-nowrap">
                  +۳۰ کاپ / -۱۵ کاپ
                </span>
              </div>
              <div className="pt-2.5 border-t border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 text-[11px] flex items-center gap-1">
                  <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-3.5 h-3.5 rounded-full" />
                  <span>جایزه پیروزی: {currentLeague.rewardGoldPerWin} سکه طلا</span>
                </span>
                <span className="text-amber-400 font-black flex items-center gap-1.5 group-hover:translate-x-[-4px] transition-transform">
                  <img src={GAME_VISUALS.duelSwordsIcon} alt="Fight" className="w-4 h-4 rounded-full" />
                  <span>شروع جستجو</span>
                </span>
              </div>
            </div>

            {/* 2. CAMPAIGN MODE BANNER */}
            <div
              onClick={() => {
                sound.play('click');
                onOpenCampaign();
              }}
              className="group relative bg-gradient-to-br from-stone-900 via-yellow-950/40 to-stone-900 border-2 border-amber-600/60 hover:border-amber-400 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xl transition-all duration-200 cursor-pointer active:scale-98 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-inner shrink-0">
                    <img src={GAME_VISUALS.mapCampaignIcon} alt="Campaign" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-black text-amber-200 group-hover:text-amber-300 transition">
                        هفت‌خوان و داستانی
                      </h4>
                      <span className="text-[9px] bg-amber-600 text-stone-950 font-black px-1.5 py-0.2 rounded-full shadow">
                        جوایز بزرگ
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-0.5">
                      پیروزی در مراحل مختلف شاهنامه و غلبه بر دیوان و غول‌ها
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2.5 border-t border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 text-[11px]">
                  کسب طلا، کارت و تجربه
                </span>
                <span className="text-amber-400 font-black flex items-center gap-1.5 group-hover:translate-x-[-4px] transition-transform">
                  <img src={GAME_VISUALS.mapCampaignIcon} alt="Map" className="w-4 h-4 rounded-full" />
                  <span>ورود به نقشه</span>
                </span>
              </div>
            </div>

            {/* 3. FRIENDLY PVP */}
            <div
              onClick={() => {
                sound.play('click');
                setFriendlyModal(true);
              }}
              className="group relative bg-gradient-to-br from-stone-900 via-cyan-950/40 to-stone-900 border-2 border-cyan-500/60 hover:border-cyan-400 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xl transition-all duration-200 cursor-pointer active:scale-98 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-inner shrink-0">
                    <img src={GAME_VISUALS.clanShieldIcon} alt="Friendly" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-black text-cyan-200 group-hover:text-cyan-300 transition">
                        دوئل دوستانه (Friendly PvP)
                      </h4>
                      <span className="text-[9px] bg-cyan-600 text-stone-950 font-black px-1.5 py-0.2 rounded-full shadow">
                        بدون کسر کاپ
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-0.5">
                      مبارزه مستقیم با دوستان یا کد اتاق نبرد بدون ریسک کاپ
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 font-bold whitespace-nowrap">
                  تمرین تاکتیک
                </span>
              </div>
              <div className="pt-2.5 border-t border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 text-[11px]">
                  انتخاب بازیکن یا کد اتاق
                </span>
                <span className="text-cyan-400 font-black flex items-center gap-1.5 group-hover:translate-x-[-4px] transition-transform">
                  <img src={GAME_VISUALS.duelSwordsIcon} alt="Fight" className="w-4 h-4 rounded-full" />
                  <span>انتخاب حریف</span>
                </span>
              </div>
            </div>

            {/* 4. BOT BATTLE */}
            <div
              onClick={() => {
                sound.play('click');
                setBotModal(true);
              }}
              className="group relative bg-gradient-to-br from-stone-900 via-emerald-950/40 to-stone-900 border-2 border-emerald-500/60 hover:border-emerald-400 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xl transition-all duration-200 cursor-pointer active:scale-98 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-inner shrink-0">
                    <img src={GAME_VISUALS.forgeEditorIcon} alt="Bot" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-black text-emerald-200 group-hover:text-emerald-300 transition">
                        میدان تمرین هوش مصنوعی
                      </h4>
                      <span className="text-[9px] bg-emerald-600 text-stone-950 font-black px-1.5 py-0.2 rounded-full shadow">
                        ۴ درجه سختی
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-0.5">
                      تست قدرت ارتش و کارت‌های جدید در برابر هوش مصنوعی هوشمند
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold whitespace-nowrap">
                  آفلاین و سریع
                </span>
              </div>
              <div className="pt-2.5 border-t border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 text-[11px]">
                  ساده، معمولی، سخت و کابوس
                </span>
                <span className="text-emerald-400 font-black flex items-center gap-1.5 group-hover:translate-x-[-4px] transition-transform">
                  <img src={GAME_VISUALS.forgeEditorIcon} alt="Practice" className="w-4 h-4 rounded-full" />
                  <span>شروع تمرین</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RANKING & LEAGUES SHOWCASE ================= */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2">
              <img src={GAME_VISUALS.crownRankIcon} alt="Crown" className="w-6 h-6 rounded-full" />
              <div>
                <h3 className="text-sm font-black text-amber-300">
                  برترین قهرمانان و پادشاهان رنکد
                </h3>
                <p className="text-[11px] text-stone-400">
                  سه مبارز صدرنشین جدول رده‌بندی کشوری
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.play('click');
                onOpenLeaderboard();
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              مشاهده جدول کامل 👈
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topPlayers.map((player, idx) => {
              const pLeague = getLeagueByTrophies(player.trophies || 150);
              const medal = idx === 0 ? '🥇 اول' : idx === 1 ? '🥈 دوم' : '🥉 سوم';
              const medalColor =
                idx === 0
                  ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                  : idx === 1
                  ? 'border-slate-400 bg-slate-900/60 text-slate-300'
                  : 'border-amber-700 bg-stone-900/60 text-amber-600';
              return (
                <div
                  key={player.id}
                  className={`rounded-2xl p-3 border flex items-center justify-between gap-3 shadow ${medalColor}`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar avatar={player.avatar} size="sm" />
                    <div>
                      <div className="text-[10px] font-bold opacity-80">{medal}</div>
                      <div className="text-xs font-black truncate max-w-[100px]">
                        {player.displayName}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {pLeague.icon} {pLeague.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-left font-black text-xs text-amber-300 flex items-center gap-1">
                    <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                    <span>{player.trophies || 150}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: MATCHMAKING MODAL ================= */}
      {matchmakingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border-2 border-amber-400 rounded-3xl p-6 text-center flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <img src={GAME_VISUALS.duelSwordsIcon} alt="PvP" className="w-5 h-5 rounded-full" />
                <span>جستجوی حریف در نبرد PvP</span>
              </h3>
              <button
                onClick={() => {
                  setMatchmakingModal(false);
                  setSearching(false);
                }}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {searching ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping" />
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl animate-pulse overflow-hidden">
                    <img src={GAME_VISUALS.duelSwordsIcon} alt="Search" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="text-sm font-bold text-amber-200">
                  در حال یافتن حریف متناسب با کاپ شما...
                </div>
                <div className="text-xs text-stone-400">
                  سطح لیگ: {currentLeague.icon} ({currentLeague.name})
                </div>
              </div>
            ) : matchedOpponent ? (
              <div className="py-3 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                <div className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/80 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5">
                  <span>✨</span>
                  <span>حریف شایسته پیدا شد!</span>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center bg-stone-950/80 p-3 rounded-2xl border border-stone-800">
                  <div className="flex flex-col items-center text-center">
                    <UserAvatar avatar={user.avatar} size="md" />
                    <span className="font-black text-xs text-amber-300 mt-1 truncate w-full">
                      {user.displayName}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      کاپ: {currentTrophies} 🏆
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <UserAvatar avatar={matchedOpponent.avatar} size="md" />
                    <span className="font-black text-xs text-rose-300 mt-1 truncate w-full">
                      {matchedOpponent.displayName}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      کاپ: {matchedOpponent.trophies || 150} 🏆
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmRankedBattle}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black py-3 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
                >
                  <img src={GAME_VISUALS.duelSwordsIcon} alt="Fight" className="w-5 h-5 rounded-full" />
                  <span>ورود به میدان نبرد ⚔️</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FRIENDLY PVP MODAL ================= */}
      {friendlyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border-2 border-cyan-400 rounded-3xl p-6 text-center flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <h3 className="text-base font-black text-cyan-300 flex items-center gap-2">
                <img src={GAME_VISUALS.clanShieldIcon} alt="Friendly" className="w-5 h-5 rounded-full" />
                <span>نبرد دوستانه (بدون کسر کاپ)</span>
              </h3>
              <button
                onClick={() => setFriendlyModal(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800 gap-1">
              <button
                onClick={() => setFriendlyTab('list')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  friendlyTab === 'list'
                    ? 'bg-cyan-500 text-stone-950 shadow font-black'
                    : 'text-stone-400'
                }`}
              >
                لیست بازیکنان
              </button>
              <button
                onClick={() => setFriendlyTab('room')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  friendlyTab === 'room'
                    ? 'bg-cyan-500 text-stone-950 shadow font-black'
                    : 'text-stone-400'
                }`}
              >
                کد اتاق نبرد
              </button>
            </div>

            {friendlyTab === 'list' ? (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {otherPlayers.map((p) => {
                  const pLg = getLeagueByTrophies(p.trophies || 150);
                  return (
                    <div
                      key={p.id}
                      className="bg-stone-950 border border-stone-800 hover:border-cyan-500/60 p-3 rounded-2xl flex items-center justify-between gap-2 shadow"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar avatar={p.avatar} size="sm" />
                        <div className="text-right">
                          <div className="font-bold text-xs text-stone-200">
                            {p.displayName}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {pLg.icon} {pLg.name} | سطح {p.level}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectFriendlyOpponent(p)}
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <img src={GAME_VISUALS.duelSwordsIcon} alt="Duel" className="w-3.5 h-3.5 rounded-full" />
                        <span>درخواست مبارزه ⚔️</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2 text-right">
                <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 space-y-1">
                  <span className="text-[11px] text-stone-400">کد اتاق شما:</span>
                  <div className="text-2xl font-black text-cyan-300 tracking-widest text-center py-1">
                    {roomCode}
                  </div>
                  <p className="text-[10px] text-stone-500 text-center">
                    این کد را به دوست خود بدهید تا وارد مبارزه اختصاصی شوید
                  </p>
                </div>

                <form onSubmit={handleJoinRoom} className="space-y-2">
                  <label className="text-xs text-stone-300 block">
                    یا کد اتاق دوستتان را وارد کنید:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="مثلاً 4829"
                      value={inputRoomCode}
                      onChange={(e) => setInputRoomCode(e.target.value)}
                      maxLength={6}
                      className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-center font-mono text-sm tracking-wider text-cyan-300"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 text-stone-950 font-black text-xs px-4 py-2 rounded-xl shadow transition cursor-pointer"
                    >
                      ورود
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 3: BOT DIFFICULTY MODAL ================= */}
      {botModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border-2 border-emerald-400 rounded-3xl p-6 text-center flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <h3 className="text-base font-black text-emerald-300 flex items-center gap-2">
                <img src={GAME_VISUALS.forgeEditorIcon} alt="Bot" className="w-5 h-5 rounded-full" />
                <span>انتخاب سطح هوش مصنوعی</span>
              </h3>
              <button
                onClick={() => setBotModal(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 text-right">
              درجه سختی ربات حریف را برای نبرد تمرینی انتخاب کنید:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'easy' as BotDifficulty, label: 'ساده (Easy)', desc: 'قدرت و جان کاهش‌یافته' },
                { id: 'normal' as BotDifficulty, label: 'معمولی (Normal)', desc: 'نیروهای متوازن' },
                { id: 'hard' as BotDifficulty, label: 'سخت (Hard)', desc: 'قدرت بیشتر و کارت‌های سطح ۲' },
                { id: 'nightmare' as BotDifficulty, label: 'کابوس (Nightmare)', desc: 'نیروهای اساطیری حداکثر' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBotDiff(b.id)}
                  className={`p-3 rounded-2xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                    selectedBotDiff === b.id
                      ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/40 text-emerald-300'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="font-black text-xs">{b.label}</span>
                  <span className="text-[10px] text-stone-400 leading-tight">{b.desc}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirmBotBattle}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-stone-950 font-black py-3 rounded-2xl shadow-xl transition active:scale-95 mt-1 cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
            >
              <img src={GAME_VISUALS.duelSwordsIcon} alt="Fight" className="w-5 h-5 rounded-full" />
              <span>شروع نبرد تمرینی 🤖</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
