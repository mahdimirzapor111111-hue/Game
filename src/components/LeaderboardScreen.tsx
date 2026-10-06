import React, { useState } from 'react';
import { UserProfile, LEAGUES, getLeagueByTrophies } from '../types/game';
import { loadAllUsers } from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS, RANK_CROWNS } from '../assets/visuals';

interface LeaderboardScreenProps {
  user: UserProfile | null;
  onChallengePlayer?: (targetUser: UserProfile) => void;
}

interface CrownDetail {
  id: string;
  rankRange: string;
  rankNumber: number;
  title: string;
  heroTitle: string;
  icon: string;
  gem: string;
  gemColor: string;
  lore: string;
  perks: string[];
  borderStyle: string;
  glowEffect: string;
  badgeBg: string;
}

const CROWN_DETAILS: CrownDetail[] = [
  {
    id: 'rank1',
    rankRange: 'مقام ۱',
    rankNumber: 1,
    title: 'تاج زرین کیانی پادشاهی',
    heroTitle: 'شاهنشاه ایران‌زمین',
    icon: GAME_VISUALS.crownGoldImperial,
    gem: 'یاقوت سرخ شاهانه و زمرد بهشتی',
    gemColor: 'text-rose-400',
    lore: 'تاج افسانه‌ای کیانی که بر تارک بزرگ‌ترین پادشاهان شاهنامه نشسته است. تنها دلاوری که در اوج قله نبردهای رنکد ایستاده باشد، شایسته بر سر نهادن این نماد قدرت مطلق است.',
    perks: [
      'دریافت روزانه ۵۰۰ سکه زر و ۵۰ زمرد افتخار',
      'حاشیه طلایی درخشان و پرتوهای نورانی دور آواتار در همه میدان‌ها',
      'عنوان اختصاصی «شاهنشاه ایران» در چت و بازارچه',
      'ندای پیروزی ویژه به هنگام آغاز نبرد در آرنا',
    ],
    borderStyle: 'border-amber-400 ring-2 ring-amber-300/60 shadow-[0_0_25px_rgba(251,191,36,0.6)]',
    glowEffect: 'from-amber-500/30 via-yellow-500/10 to-transparent',
    badgeBg: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-stone-950 font-black',
  },
  {
    id: 'rank2',
    rankRange: 'مقام ۲',
    rankNumber: 2,
    title: 'تاج سیمین سپهبد اعظم',
    heroTitle: 'نایب‌قهرمان و جهان‌پهلوان',
    icon: GAME_VISUALS.crownSilverRegal,
    gem: 'یاقوت کبود آسمانی و بلور خالص',
    gemColor: 'text-cyan-300',
    lore: 'ریخته‌گری شده از سیم صیقلی سپید و جواهرات نیلگون آسمانی؛ این تاج به سپهبد اعظم ارتش اهورایی و هماورد مستقیم پادشاه اعطا می‌شود.',
    perks: [
      'دریافت روزانه ۳۰۰ سکه زر و ۳۰ زمرد افتخار',
      'حاشیه نقره‌ای شکوهمند دور تصویر پروفایل',
      'عنوان اختصاصی «سپهبد اعظم» در پروفایل و لیدربرد',
      'تخفیف ۱۰ درصدی در کارمزد خرید و فروش کارت‌ها',
    ],
    borderStyle: 'border-slate-300 ring-2 ring-cyan-200/50 shadow-[0_0_20px_rgba(203,213,225,0.5)]',
    glowEffect: 'from-slate-400/25 via-cyan-400/10 to-transparent',
    badgeBg: 'bg-gradient-to-r from-slate-200 via-cyan-200 to-slate-400 text-stone-950 font-black',
  },
  {
    id: 'rank3',
    rankRange: 'مقام ۳',
    rankNumber: 3,
    title: 'تاج مفرغی دلاور اساطیری',
    heroTitle: 'یل نامدار البرز',
    icon: GAME_VISUALS.crownBronzeWarrior,
    gem: 'کهربای درخشان و فیروزه پارسی',
    gemColor: 'text-amber-400',
    lore: 'ساخته شده با مفرغ باستانی و نشان‌های کهن آهنگران نامور؛ پاداش سومین رزم‌آور ایستاده بر سکوی جاودانگان شاهنامه.',
    perks: [
      'دریافت روزانه ۲۰۰ سکه زر و ۲۰ زمرد افتخار',
      'حاشیه مفرغی برنزی دور عکس نمایه',
      'عنوان «یل نامدار» در تالار افتخارات',
      'شانس مضاعف دریافت صندوق‌های باستانی در نبرد',
    ],
    borderStyle: 'border-amber-600 ring-2 ring-orange-500/50 shadow-[0_0_20px_rgba(217,119,6,0.5)]',
    glowEffect: 'from-amber-600/25 via-orange-600/10 to-transparent',
    badgeBg: 'bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-amber-100 font-black',
  },
  {
    id: 'top10',
    rankRange: 'رتبه‌های ۴ تا ۱۰',
    rankNumber: 4,
    title: 'نیم‌تاج زرین یلان دهگانه',
    heroTitle: 'پهلوان شورای بزرگان',
    icon: GAME_VISUALS.crownTopChampion,
    gem: 'آمیتیست بنفش و حاشیه‌های سیمرغ',
    gemColor: 'text-purple-300',
    lore: 'حلقه زرین و بنفش دلاوران برگزیده دهگانه ایران؛ نشانی از مهارت فوق‌العاده و ورود به محفل برترین استراتژیست‌های میدان مبارزه.',
    perks: [
      'دریافت روزانه ۱۰۰ سکه زر و ۱۰ زمرد افتخار',
      'حاشیه بنفش جادویی دور آواتار و کارت‌ها',
      'نشان ۱۰ یل برتر در جدول مسابقات و کلن‌ها',
      'دسترسی زودهنگام به رویدادهای قهرمانی ویژه',
    ],
    borderStyle: 'border-purple-400 ring-2 ring-purple-500/40 shadow-[0_0_18px_rgba(168,85,247,0.45)]',
    glowEffect: 'from-purple-700/25 via-fuchsia-600/10 to-transparent',
    badgeBg: 'bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-purple-100 font-bold',
  },
];

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  user,
  onChallengePlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'crowns' | 'leagues'>('ranking');
  const [selectedCrown, setSelectedCrown] = useState<CrownDetail | null>(null);

  const allUsers = loadAllUsers();
  const sorted = [...allUsers].sort(
    (a, b) => (b.trophies || 150) - (a.trophies || 150) || b.wins - a.wins
  );

  const totalBattles = user ? user.wins + user.losses : 0;
  const winRate = totalBattles > 0 ? Math.round((user!.wins / totalBattles) * 100) : 0;
  const userLeague = getLeagueByTrophies(user?.trophies || 150);

  const userRankIndex = sorted.findIndex((u) => u.id === user?.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : sorted.length + 1;

  // Get Crown config for a specific rank
  const getCrownConfig = (rank: number) => {
    if (rank === 1) return CROWN_DETAILS[0];
    if (rank === 2) return CROWN_DETAILS[1];
    if (rank === 3) return CROWN_DETAILS[2];
    if (rank <= 10) return CROWN_DETAILS[3];
    return null;
  };

  const currentUserCrown = getCrownConfig(userRank);

  // Top 3 for podium
  const rank1User = sorted[0];
  const rank2User = sorted[1];
  const rank3User = sorted[2];

  return (
    <div className="w-full flex-1 flex flex-col items-center p-3 sm:p-5 overflow-y-auto select-none bg-stone-950 text-stone-100 pb-24">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* ================= HALL OF FAME HERO BANNER ================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src={GAME_VISUALS.hallOfFameBanner}
            alt="Hall of Fame"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/85 via-stone-950/75 to-purple-950/85 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4 text-center md:text-right">
            <button
              onClick={() => {
                sound.play('click');
                setSelectedCrown(CROWN_DETAILS[0]);
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] shrink-0 bg-stone-900 ring-4 ring-amber-500/30 hover:scale-105 transition cursor-pointer group"
              title="مشاهده تاج زرین کیانی"
            >
              <img
                src={GAME_VISUALS.crownGoldImperial}
                alt="Crown"
                className="w-full h-full object-cover group-hover:rotate-3 transition duration-300"
              />
            </button>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h2 className="text-lg sm:text-2xl font-black text-amber-200 drop-shadow">
                  رده‌بندی و تالار تاج‌های پادشاهی شاهنامه
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-black">
                  فصل جاری
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed drop-shadow">
                برترین پهلوانان ایران‌زمین را به چالش بکشید، کاپ کسب کنید و تاج‌های زرین، سیمین و مفرغی پادشاهی را تصاحب نمایید.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <button
              onClick={() => {
                sound.play('click');
                setActiveTab('crowns');
              }}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/60 px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <img src={GAME_VISUALS.crownGoldImperial} alt="Crowns" className="w-5 h-5 rounded-md object-cover" />
              <span>تالار تاج‌ها 👑</span>
            </button>
          </div>
        </div>

        {/* User Rank Card */}
        {user && (
          <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border-2 border-amber-500/70 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <UserAvatar
                avatar={user.avatar}
                size="lg"
                className="border-2 border-amber-400 shadow"
                crownRank={userRank <= 10 ? userRank : undefined}
              />
              <div className="text-right space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base text-amber-200">
                    {user.displayName}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${userLeague.badgeBg} flex items-center gap-1`}>
                    <span>{userLeague.icon}</span>
                    <span>{userLeague.name}</span>
                  </span>

                  {currentUserCrown ? (
                    <button
                      onClick={() => {
                        sound.play('click');
                        setSelectedCrown(currentUserCrown);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-black cursor-pointer hover:scale-105 transition shadow ${currentUserCrown.badgeBg}`}
                      title="مشاهده ویژگی‌های تاج شما"
                    >
                      <img src={currentUserCrown.icon} alt="Crown" className="w-3.5 h-3.5 rounded object-cover" />
                      <span>{currentUserCrown.rankRange}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full border border-stone-700">
                      رتبه شما: #{userRank}
                    </span>
                  )}
                </div>

                <div className="text-xs text-stone-300 flex items-center gap-1.5">
                  <span>امتیاز رنکد:</span>
                  <b className="text-amber-400 font-black flex items-center gap-1">
                    <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                    <span>{user.trophies || 150} کاپ</span>
                  </b>
                  <span className="text-stone-500">•</span>
                  {userRank <= 3 ? (
                    <span className="text-amber-300 font-bold">
                      دارنده {currentUserCrown?.title} 👑
                    </span>
                  ) : userRank <= 10 ? (
                    <span className="text-purple-300 font-bold">
                      عضو ۱۰ یل برتر ایران‌زمین 🔮
                    </span>
                  ) : (
                    <span className="text-stone-400">
                      فاصله تا نیم‌تاج ۱۰ برتر: {Math.max(1, (sorted[9]?.trophies || 150) - (user.trophies || 150) + 1)} کاپ
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400">
                  {user.wins} پیروزی | نرخ برد: {winRate}% | سطح {user.level}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="bg-stone-950/80 px-3.5 py-2 rounded-2xl border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block">رتبه کشوری</span>
                <b className="text-amber-300 font-black text-sm">#{userRank}</b>
              </div>
              <div className="bg-stone-950/80 px-3.5 py-2 rounded-2xl border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block">کل نبردها</span>
                <b className="text-stone-100">{totalBattles}</b>
              </div>
              <div className="bg-stone-950/80 px-3.5 py-2 rounded-2xl border border-stone-800 text-center">
                <span className="text-[10px] text-emerald-400 block">بردها</span>
                <b className="text-emerald-300">{user.wins}</b>
              </div>
              <div className="bg-stone-950/80 px-3.5 py-2 rounded-2xl border border-stone-800 text-center">
                <span className="text-[10px] text-rose-400 block">باخت‌ها</span>
                <b className="text-rose-300">{user.losses}</b>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-stone-900 p-1.5 rounded-2xl border border-stone-800 gap-1.5">
          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('ranking');
            }}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ranking'
                ? 'bg-amber-500 text-stone-950 shadow-lg font-black border border-amber-300'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <img src={GAME_VISUALS.crownRankIcon} alt="Rank" className="w-4 h-4 rounded-full object-cover" />
            <span>جدول رتبه‌بندی 🥇</span>
          </button>

          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('crowns');
            }}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'crowns'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-lg font-black border border-amber-300'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <img src={GAME_VISUALS.crownGoldImperial} alt="Crowns" className="w-4 h-4 rounded object-cover" />
            <span>طراحی و درجات تاج‌ها 👑</span>
          </button>

          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('leagues');
            }}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'leagues'
                ? 'bg-amber-500 text-stone-950 shadow-lg font-black border border-amber-300'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <img src={GAME_VISUALS.trophyEventsIcon} alt="Leagues" className="w-4 h-4 rounded-full object-cover" />
            <span>لیگ‌ها و پاداش‌ها 🏆</span>
          </button>
        </div>

        {/* TAB 1: RANKED LEADERBOARD & PODIUM */}
        {activeTab === 'ranking' && (
          <div className="flex flex-col gap-4">
            {/* ================= ROYAL PODIUM (TOP 3 CHAMPIONS) ================= */}
            <div className="relative rounded-3xl bg-gradient-to-b from-stone-900/90 via-stone-950 to-stone-900 border-2 border-amber-500/40 p-4 sm:p-6 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10 text-center mb-5">
                <span className="text-[11px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  سکوی افتخار سه پادشاه و پهلوان برتر ایران
                </span>
                <h3 className="text-base sm:text-xl font-black text-amber-200 mt-1.5 drop-shadow">
                  دارندگان تاج‌های زرین، سیمین و مفرغی
                </h3>
              </div>

              {/* 3 Pedestals */}
              <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 pb-2">
                {/* RANK 2: SILVER REGAL (RIGHT) */}
                {rank2User && (
                  <div className="flex flex-col items-center text-center group">
                    <div className="relative mb-2">
                      <button
                        onClick={() => {
                          sound.play('click');
                          setSelectedCrown(CROWN_DETAILS[1]);
                        }}
                        className="w-12 h-12 sm:w-16 sm:h-16 -mb-4 z-20 relative transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                        title="مشاهده تاج سیمین جهان‌پهلوان"
                      >
                        <img
                          src={GAME_VISUALS.crownSilverRegal}
                          alt="Silver Crown"
                          className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(203,213,225,0.7)]"
                        />
                      </button>
                      <UserAvatar
                        avatar={rank2User.avatar}
                        size="lg"
                        className="border-2 border-slate-300 ring-4 ring-slate-400/30 shadow-[0_0_15px_rgba(203,213,225,0.4)]"
                      />
                    </div>
                    <div className="text-xs font-black text-slate-200 truncate max-w-[90px] sm:max-w-[130px]">
                      {rank2User.displayName}
                    </div>
                    <div className="text-[10px] text-cyan-300 font-bold flex items-center gap-1 mt-0.5">
                      <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3 h-3 rounded-full" />
                      <span>{rank2User.trophies || 150} کاپ</span>
                    </div>

                    {/* Pedestal Box */}
                    <div className="w-full mt-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-slate-400/50 p-2.5 sm:p-3.5 flex flex-col items-center shadow-lg h-28 sm:h-32 justify-between">
                      <div className="w-8 h-8 rounded-full bg-slate-300 text-stone-950 font-black text-sm flex items-center justify-center shadow">
                        ۲
                      </div>
                      <div className="text-[10px] text-slate-300 font-bold">
                        تاج سیمین
                      </div>
                      {onChallengePlayer && rank2User.id !== user?.id && (
                        <button
                          onClick={() => {
                            sound.play('click');
                            onChallengePlayer(rank2User);
                          }}
                          className="w-full text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-100 py-1 rounded-lg font-bold border border-slate-500/50 transition cursor-pointer"
                        >
                          دوئل ⚔️
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* RANK 1: GOLD IMPERIAL (CENTER - TALLEST) */}
                {rank1User && (
                  <div className="flex flex-col items-center text-center group -mt-6">
                    <div className="relative mb-2">
                      <button
                        onClick={() => {
                          sound.play('click');
                          setSelectedCrown(CROWN_DETAILS[0]);
                        }}
                        className="w-16 h-16 sm:w-20 sm:h-20 -mb-5 z-20 relative transition-transform duration-300 group-hover:scale-115 cursor-pointer animate-pulse"
                        title="مشاهده تاج زرین کیانی (شاهنشاه)"
                      >
                        <img
                          src={GAME_VISUALS.crownGoldImperial}
                          alt="Gold Crown"
                          className="w-full h-full object-contain filter drop-shadow-[0_6px_15px_rgba(251,191,36,0.9)]"
                        />
                      </button>
                      <UserAvatar
                        avatar={rank1User.avatar}
                        size="xl"
                        className="border-4 border-amber-400 ring-4 ring-amber-500/50 shadow-[0_0_25px_rgba(251,191,36,0.7)]"
                      />
                    </div>
                    <div className="text-xs sm:text-sm font-black text-amber-200 truncate max-w-[100px] sm:max-w-[150px]">
                      {rank1User.displayName}
                    </div>
                    <div className="text-[11px] text-amber-400 font-black flex items-center gap-1 mt-0.5">
                      <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                      <span>{rank1User.trophies || 150} کاپ</span>
                    </div>

                    {/* Pedestal Box */}
                    <div className="w-full mt-3 rounded-2xl bg-gradient-to-b from-amber-900/60 via-stone-900 to-amber-950 border-2 border-amber-400 p-2.5 sm:p-4 flex flex-col items-center shadow-[0_0_20px_rgba(251,191,36,0.3)] h-36 sm:h-40 justify-between">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-950 font-black text-base flex items-center justify-center shadow-lg border border-amber-200">
                        ۱
                      </div>
                      <div className="text-xs text-amber-300 font-black flex items-center gap-1">
                        <span>تاج زرین کیانی</span>
                        <span>👑</span>
                      </div>
                      {onChallengePlayer && rank1User.id !== user?.id && (
                        <button
                          onClick={() => {
                            sound.play('click');
                            onChallengePlayer(rank1User);
                          }}
                          className="w-full text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 py-1.5 rounded-lg font-black border border-amber-300 shadow transition cursor-pointer"
                        >
                          نبرد با شاهنشاه ⚔️
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* RANK 3: BRONZE WARRIOR (LEFT) */}
                {rank3User && (
                  <div className="flex flex-col items-center text-center group">
                    <div className="relative mb-2">
                      <button
                        onClick={() => {
                          sound.play('click');
                          setSelectedCrown(CROWN_DETAILS[2]);
                        }}
                        className="w-12 h-12 sm:w-16 sm:h-16 -mb-4 z-20 relative transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                        title="مشاهده تاج مفرغی دلاور اساطیری"
                      >
                        <img
                          src={GAME_VISUALS.crownBronzeWarrior}
                          alt="Bronze Crown"
                          className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(217,119,6,0.7)]"
                        />
                      </button>
                      <UserAvatar
                        avatar={rank3User.avatar}
                        size="lg"
                        className="border-2 border-amber-700 ring-4 ring-amber-800/40 shadow-[0_0_15px_rgba(217,119,6,0.4)]"
                      />
                    </div>
                    <div className="text-xs font-black text-amber-200/90 truncate max-w-[90px] sm:max-w-[130px]">
                      {rank3User.displayName}
                    </div>
                    <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                      <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3 h-3 rounded-full" />
                      <span>{rank3User.trophies || 150} کاپ</span>
                    </div>

                    {/* Pedestal Box */}
                    <div className="w-full mt-3 rounded-2xl bg-gradient-to-b from-stone-900 to-amber-950 border-2 border-amber-700/60 p-2.5 sm:p-3.5 flex flex-col items-center shadow-lg h-24 sm:h-28 justify-between">
                      <div className="w-8 h-8 rounded-full bg-amber-800 text-amber-100 font-black text-sm flex items-center justify-center shadow">
                        ۳
                      </div>
                      <div className="text-[10px] text-amber-400 font-bold">
                        تاج مفرغی
                      </div>
                      {onChallengePlayer && rank3User.id !== user?.id && (
                        <button
                          onClick={() => {
                            sound.play('click');
                            onChallengePlayer(rank3User);
                          }}
                          className="w-full text-[10px] bg-amber-900/60 hover:bg-amber-800 text-amber-200 py-1 rounded-lg font-bold border border-amber-700/50 transition cursor-pointer"
                        >
                          دوئل ⚔️
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= LEADERBOARD TABLE ROWS ================= */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
              <div className="flex justify-between items-center px-2 py-1 text-xs text-stone-400 font-bold border-b border-stone-800/80 pb-2">
                <span>رتبه و تاج پهلوان</span>
                <div className="flex items-center gap-6">
                  <span>برد / باخت</span>
                  <span>کاپ رنکد</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {sorted.map((u, idx) => {
                  const isMe = user?.id === u.id;
                  const pLeague = getLeagueByTrophies(u.trophies || 150);
                  const rank = idx + 1;
                  const crown = getCrownConfig(rank);

                  const rowBg =
                    rank === 1
                      ? 'bg-gradient-to-r from-amber-950/50 via-stone-900 to-amber-950/20 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/40'
                      : rank === 2
                      ? 'bg-gradient-to-r from-slate-900/60 via-stone-900 to-slate-900/30 border-slate-400/60 shadow-[0_0_15px_rgba(203,213,225,0.1)] ring-1 ring-slate-400/30'
                      : rank === 3
                      ? 'bg-gradient-to-r from-amber-950/30 via-stone-900 to-amber-950/20 border-amber-700/60 ring-1 ring-amber-700/30'
                      : rank <= 10
                      ? 'bg-gradient-to-r from-purple-950/20 via-stone-900 to-stone-900 border-purple-500/30 hover:border-purple-500/60'
                      : isMe
                      ? 'bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-500/30'
                      : 'bg-stone-950/60 border-stone-800/80';

                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition duration-150 hover:border-amber-500/70 ${rowBg}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Crown / Rank Icon Badge */}
                        <div className="shrink-0 flex items-center justify-center">
                          {crown ? (
                            <button
                              onClick={() => {
                                sound.play('click');
                                setSelectedCrown(crown);
                              }}
                              className={`relative group cursor-pointer transition transform hover:scale-110 flex items-center justify-center ${
                                rank === 1
                                  ? 'w-11 h-11 rounded-2xl p-1 bg-amber-500/15 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                                  : rank === 2
                                  ? 'w-10 h-10 rounded-2xl p-1 bg-slate-400/15 border-2 border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.4)]'
                                  : rank === 3
                                  ? 'w-10 h-10 rounded-2xl p-1 bg-amber-800/15 border-2 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.4)]'
                                  : 'w-9 h-9 rounded-xl p-1 bg-purple-900/30 border border-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                              }`}
                              title={`مشاهده ویژگی‌های ${crown.title}`}
                            >
                              <img
                                src={crown.icon}
                                alt={crown.title}
                                className="w-full h-full object-contain filter drop-shadow"
                              />
                              <span className="absolute -bottom-1 -right-1 bg-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-md border border-stone-700 text-stone-200 leading-tight">
                                {rank}
                              </span>
                            </button>
                          ) : (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 bg-stone-900 text-stone-400 border border-stone-800">
                              #{rank}
                            </div>
                          )}
                        </div>

                        {/* Player Avatar with crown */}
                        <UserAvatar avatar={u.avatar} size="md" crownRank={rank <= 10 ? rank : undefined} />

                        {/* Player Info */}
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-stone-100 flex-wrap">
                            <span>{u.displayName}</span>

                            {rank === 1 && (
                              <span className="text-[9px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow">
                                👑 شاهنشاه
                              </span>
                            )}
                            {rank === 2 && (
                              <span className="text-[9px] bg-slate-300 text-stone-950 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow">
                                🥈 سپهبد
                              </span>
                            )}
                            {rank === 3 && (
                              <span className="text-[9px] bg-amber-700 text-amber-100 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow">
                                🥉 یل دلاور
                              </span>
                            )}
                            {rank >= 4 && rank <= 10 && (
                              <span className="text-[9px] bg-purple-900/80 text-purple-200 border border-purple-500/50 px-1.5 py-0.2 rounded-full font-bold">
                                ۱۰ یل برتر
                              </span>
                            )}

                            {u.role === 'admin' && (
                              <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-black">
                                مدیر کل
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[9px] bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded-full font-black">
                                شما
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                            <span>{pLeague.icon}</span>
                            <span className={pLeague.color}>{pLeague.name}</span>
                            <span>•</span>
                            <span>سطح {u.level}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 sm:gap-4">
                        <div className="text-left text-xs font-bold">
                          <span className="text-emerald-400">{u.wins}W</span>
                          <span className="text-stone-500 mx-1">/</span>
                          <span className="text-rose-400">{u.losses}L</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-stone-950/90 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 font-black text-xs sm:text-sm shadow-inner min-w-[70px] justify-center">
                          <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                          <span>{u.trophies || 150}</span>
                        </div>

                        {!isMe && onChallengePlayer && (
                          <button
                            onClick={() => {
                              sound.play('click');
                              onChallengePlayer(u);
                            }}
                            className="hidden sm:flex items-center gap-1.5 bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer"
                            title="دوئل دوستانه با این بازیکن"
                          >
                            <img src={GAME_VISUALS.duelSwordsIcon} alt="Duel" className="w-3.5 h-3.5 rounded-full" />
                            <span>دوئل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CROWN SHOWCASE & DESIGN GALLERY */}
        {activeTab === 'crowns' && (
          <div className="flex flex-col gap-4">
            <div className="bg-stone-900/90 border border-amber-500/40 rounded-3xl p-5 shadow-xl text-center space-y-2">
              <span className="text-xs text-amber-400 font-black tracking-wider uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                گنجینه و تالار تاج‌های شاهنامه
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-amber-200">
                درجات شکوه و پاداش تاج‌های رنکد
              </h3>
              <p className="text-xs text-stone-300 max-w-2xl mx-auto leading-relaxed">
                هر تاج نمایانگر بالاترین افتخارات در میدان نبردهای آنلاین است. با صعود در جدول رده‌بندی کشوری، قفل تاج‌های باارزش‌تر را شکسته و پاداش‌های روزانه و هاله اختصاصی کسب کنید.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CROWN_DETAILS.map((crown) => {
                const holder =
                  crown.rankNumber === 1
                    ? rank1User
                    : crown.rankNumber === 2
                    ? rank2User
                    : crown.rankNumber === 3
                    ? rank3User
                    : null;

                const isUserHolding =
                  (crown.rankNumber === 1 && userRank === 1) ||
                  (crown.rankNumber === 2 && userRank === 2) ||
                  (crown.rankNumber === 3 && userRank === 3) ||
                  (crown.rankNumber === 4 && userRank >= 4 && userRank <= 10);

                return (
                  <div
                    key={crown.id}
                    className={`relative rounded-3xl bg-stone-900/90 border-2 p-5 flex flex-col justify-between gap-4 transition duration-300 hover:scale-[1.01] shadow-2xl ${crown.borderStyle}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-950/90 border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-lg">
                          <img
                            src={crown.icon}
                            alt={crown.title}
                            className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                          />
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full ${crown.badgeBg}`}>
                              {crown.rankRange}
                            </span>
                            {isUserHolding && (
                              <span className="text-[10px] bg-emerald-500 text-stone-950 font-black px-2 py-0.5 rounded-full shadow">
                                در تصاحب شما ✨
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-amber-200">
                            {crown.title}
                          </h4>
                          <div className="text-xs text-stone-400 font-bold">
                            لقب پهلوان: <span className="text-stone-200">{crown.heroTitle}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gem & Lore */}
                    <div className="space-y-2 text-xs">
                      <div className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
                        <span className="text-stone-400">جواهر و نگین اصلی:</span>
                        <span className={`font-black ${crown.gemColor}`}>{crown.gem}</span>
                      </div>

                      <p className="text-stone-300 text-xs leading-relaxed bg-stone-950/40 p-3 rounded-xl border border-stone-800/80">
                        {crown.lore}
                      </p>
                    </div>

                    {/* Perks */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black text-amber-300 block">
                        مواهب و امتیازات اختصاصی:
                      </span>
                      <ul className="text-xs text-stone-300 space-y-1 list-disc list-inside">
                        {crown.perks.map((perk, i) => (
                          <li key={i} className="text-[11px] leading-relaxed">
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Holder info */}
                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                      <div className="text-xs text-stone-400 flex items-center gap-1.5">
                        <span>دارنده فعلی:</span>
                        {holder ? (
                          <span className="text-amber-200 font-black flex items-center gap-1">
                            <UserAvatar avatar={holder.avatar} size="xs" />
                            <span>{holder.displayName}</span>
                          </span>
                        ) : (
                          <span className="text-purple-300 font-bold">پهلوانان رتبه‌های ۴ تا ۱۰</span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          sound.play('click');
                          setSelectedCrown(crown);
                        }}
                        className="text-xs bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-stone-950 font-bold px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer"
                      >
                        مشاهده سه‌بعدی 🔍
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LEAGUES LADDER */}
        {activeTab === 'leagues' && (
          <div className="flex flex-col gap-3">
            {LEAGUES.map((lg) => {
              const isUserHere = lg.id === userLeague.id;
              return (
                <div
                  key={lg.id}
                  className={`p-5 rounded-3xl border-2 transition shadow-xl ${lg.badgeBg} ${lg.borderColor} ${
                    isUserHere ? 'ring-2 ring-amber-400/80 scale-[1.01]' : 'opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-stone-950/90 border-2 border-white/20 flex items-center justify-center text-3xl shadow">
                        {lg.icon}
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-base font-black ${lg.color}`}>
                            {lg.name}
                          </h4>
                          {isUserHere && (
                            <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full shadow">
                              لیگ فعلی شما
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-300">{lg.description}</p>
                      </div>
                    </div>

                    <div className="text-left space-y-1">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1 justify-end">
                        <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                        <span>حداقل کاپ: <b>+{lg.minTrophies}</b></span>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1 justify-end">
                        <img src={GAME_VISUALS.coinIcon} alt="Coin" className="w-3 h-3 rounded-full" />
                        <span>جایزه پیروزی: {lg.rewardGoldPerWin} سکه طلا</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= CROWN DETAIL MODAL ================= */}
      {selectedCrown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedCrown(null)}
        >
          <div
            className={`relative w-full max-w-lg bg-stone-900 border-2 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-right ${selectedCrown.borderStyle}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedCrown(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold text-sm cursor-pointer transition border border-stone-700"
            >
              ✕
            </button>

            {/* Crown Large 3D Display */}
            <div className="flex flex-col items-center justify-center py-4 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-stone-950/80 border-2 border-white/10 p-3 shadow-2xl relative z-10 flex items-center justify-center group hover:scale-105 transition duration-300">
                <img
                  src={selectedCrown.icon}
                  alt={selectedCrown.title}
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]"
                />
              </div>
              <div className="mt-3 text-center">
                <span className={`text-xs px-3 py-1 rounded-full font-black ${selectedCrown.badgeBg}`}>
                  {selectedCrown.rankRange}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-amber-200 mt-1.5">
                  {selectedCrown.title}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  لقب صاحب تاج: <b className="text-amber-300">{selectedCrown.heroTitle}</b>
                </p>
              </div>
            </div>

            {/* Details Box */}
            <div className="bg-stone-950/80 rounded-2xl p-4 border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <span className="text-stone-400">جواهرات سلطنتی:</span>
                <span className={`font-black ${selectedCrown.gemColor}`}>
                  {selectedCrown.gem}
                </span>
              </div>
              <p className="text-stone-300 leading-relaxed text-xs pt-1">
                {selectedCrown.lore}
              </p>
            </div>

            {/* Perks */}
            <div className="bg-stone-950/60 rounded-2xl p-4 border border-stone-800/80 space-y-2">
              <span className="text-xs font-black text-amber-300 block">
                مواهب و پاداش‌های دارنده این تاج:
              </span>
              <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                {selectedCrown.perks.map((p, i) => (
                  <li key={i} className="leading-relaxed">
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                sound.play('click');
                setSelectedCrown(null);
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3 rounded-2xl shadow-lg transition cursor-pointer border border-amber-300"
            >
              بستن و بازگشت به میدان
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
