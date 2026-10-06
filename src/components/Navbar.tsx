import React from 'react';
import { UserProfile } from '../types/game';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS } from '../assets/visuals';

// Import dedicated navigation icon artworks
import navHome from '../assets/images/nav_palace_home_1791041878968.jpg';
import navEvents from '../assets/images/nav_trophy_events_1791041889796.jpg';
import navClan from '../assets/images/nav_clan_shield_1791041848949.jpg';
import navCampaign from '../assets/images/nav_map_campaign_1791041902842.jpg';
import navDeck from '../assets/images/nav_deck_swords_1791041863420.jpg';
import navEditor from '../assets/images/nav_forge_editor_1791041913746.jpg';
import navLeaderboard from '../assets/images/nav_crown_rank_1791041946150.jpg';
import navMarket from '../assets/images/nav_market_scales_1791041935209.jpg';
import navShop from '../assets/images/shop_chest_gold_1791041168090.jpg';
import navAdmin from '../assets/images/rostam_hero_1791041080508.jpg';

export type ScreenTab =
  | 'home'
  | 'events'
  | 'clan'
  | 'campaign'
  | 'battle'
  | 'deck'
  | 'editor'
  | 'market'
  | 'shop'
  | 'leaderboard'
  | 'admin';

interface NavbarProps {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenGifts?: () => void;
  onOpenUsdFinance?: () => void;
  onOpenGlobalChat?: () => void;
  onOpenTutorial?: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenGifts,
  onOpenUsdFinance,
  onOpenGlobalChat,
  onOpenTutorial,
  onOpenSettings,
  onLogout,
}) => {
  const isAdmin = user?.role === 'admin';
  const xpPercent = user ? Math.min(100, Math.round(((user.xp % 500) / 500) * 100)) : 0;
  const unclaimedGiftsCount = user?.gifts ? user.gifts.filter((g) => !g.claimed).length : 0;

  const NAV_ITEMS = [
    {
      id: 'home' as ScreenTab,
      img: navHome,
      icon: '🏰',
      label: 'دربار اصلی',
      glowColor: 'from-amber-600/30 to-yellow-500/20 border-amber-400',
    },
    {
      id: 'events' as ScreenTab,
      img: navEvents,
      icon: '🏆',
      label: 'مسابقات',
      glowColor: 'from-rose-600/30 to-amber-500/20 border-rose-400',
    },
    {
      id: 'clan' as ScreenTab,
      img: navClan,
      icon: '🛡️',
      label: 'اتحادیه',
      glowColor: 'from-purple-600/30 to-indigo-500/20 border-purple-400',
    },
    {
      id: 'campaign' as ScreenTab,
      img: navCampaign,
      icon: '🗺️',
      label: 'هفت‌خوان',
      glowColor: 'from-yellow-600/30 to-amber-500/20 border-yellow-400',
    },
    {
      id: 'deck' as ScreenTab,
      img: navDeck,
      icon: '⚔️',
      label: 'چیدمان ارتش',
      glowColor: 'from-emerald-600/30 to-teal-500/20 border-emerald-400',
    },
    {
      id: 'editor' as ScreenTab,
      img: navEditor,
      icon: '🛠️',
      label: 'ادیتور کارت',
      glowColor: 'from-cyan-600/30 to-blue-500/20 border-cyan-400',
    },
    {
      id: 'leaderboard' as ScreenTab,
      img: navLeaderboard,
      icon: '🥇',
      label: 'رده‌بندی',
      glowColor: 'from-amber-500/30 to-orange-500/20 border-amber-400',
    },
    {
      id: 'market' as ScreenTab,
      img: navMarket,
      icon: '⚖️',
      label: 'بازارچه',
      glowColor: 'from-yellow-700/30 to-amber-600/20 border-yellow-500',
    },
    {
      id: 'shop' as ScreenTab,
      img: navShop,
      icon: '🎁',
      label: 'صندوق‌ها',
      glowColor: 'from-purple-700/30 to-pink-500/20 border-pink-400',
    },
  ];

  if (isAdmin) {
    NAV_ITEMS.push({
      id: 'admin' as ScreenTab,
      img: navAdmin,
      icon: '👑',
      label: 'مدیریت کل',
      glowColor: 'from-red-600/40 to-rose-500/30 border-rose-500',
    });
  }

  return (
    <>
      {/* Top Header */}
      <header className="bg-stone-900/95 border-b border-stone-800 text-stone-100 px-3 py-2 shrink-0 z-30 shadow-md backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* User Profile Trigger */}
          {user ? (
            <div
              onClick={() => {
                sound.play('click');
                if (onOpenProfile) onOpenProfile();
                else onOpenAuth();
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition active:scale-98"
              title="مشاهده و ویرایش پروفایل"
            >
              <div className="relative">
                <UserAvatar avatar={user.avatar} size="sm" className="border-2 border-amber-400 shadow" />
                {isAdmin && (
                  <span className="absolute -bottom-1 -right-1 text-[10px] drop-shadow">
                    👑
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm text-amber-200 truncate max-w-[110px] sm:max-w-[160px]">
                    {user.displayName}
                  </span>
                  {isAdmin ? (
                    <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full shadow">
                      مدیر کل
                    </span>
                  ) : (
                    <span className="text-[9px] bg-stone-800 text-amber-300 font-bold px-1.5 py-0.2 rounded-full border border-stone-700">
                      سطح {user.level}
                    </span>
                  )}
                </div>
                {/* XP Progress Bar */}
                <div className="w-20 sm:w-28 h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs px-3 py-2 rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>🔑</span>
              <span>ورود / ثبت‌نام</span>
            </button>
          )}

          {/* Currencies & Quick Controls */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-black">
                <div className="flex items-center gap-1 bg-stone-950/90 border border-amber-500/40 px-2 sm:px-2.5 py-1 rounded-xl text-amber-300 shadow-inner" title="کاپ و رتبه">
                  <span className="text-xs">🏆</span>
                  <span>{user.trophies || 150}</span>
                </div>
                <div className="flex items-center gap-1 bg-stone-950/90 border border-amber-500/40 px-2 sm:px-2.5 py-1 rounded-xl text-amber-300 shadow-inner" title="سکه طلا">
                  <span className="text-xs">💰</span>
                  <span>{user.gold}</span>
                </div>
                <div className="flex items-center gap-1 bg-stone-950/90 border border-cyan-500/40 px-2 sm:px-2.5 py-1 rounded-xl text-cyan-300 shadow-inner" title="الماس جادویی">
                  <span className="text-xs">💎</span>
                  <span>{user.gems}</span>
                </div>
                {/* US Dollar (USD $) Currency Badge */}
                <div
                  onClick={() => {
                    sound.play('click');
                    if (onOpenUsdFinance) onOpenUsdFinance();
                  }}
                  className="flex items-center gap-1 bg-gradient-to-r from-emerald-950/90 to-green-950/90 border border-emerald-500/50 hover:border-emerald-400 px-2 sm:px-2.5 py-1 rounded-xl text-emerald-300 shadow-inner hover:scale-105 transition cursor-pointer"
                  title="موجودی دلار آمریکا ($ USD) - کلیک برای واریز (حداقل ۱۰$)، برداشت (حداقل ۲۰$) یا چت با ادمین"
                >
                  <span className="text-xs">💵</span>
                  <span>${user.usd || 0}</span>
                  <span className="hidden sm:inline text-[9px] text-emerald-400 font-bold bg-emerald-900/60 px-1 py-0.2 rounded mr-0.5">
                    USD
                  </span>
                </div>
              </div>
            )}

            {user && (
              <button
                onClick={() => {
                  sound.play('click');
                  if (onOpenGlobalChat) onOpenGlobalChat();
                }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400/80 flex items-center justify-center text-stone-950 text-xs shadow-md transition active:scale-95 cursor-pointer font-bold relative"
                title="تالار چت جهانی و چت بین کلن‌ها"
              >
                💬
              </button>
            )}

            {!user?.completedTutorial && (
              <button
                onClick={() => {
                  sound.play('click');
                  if (onOpenTutorial) onOpenTutorial();
                }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-900 to-blue-900 hover:from-cyan-800 hover:to-blue-800 border border-cyan-400/60 flex items-center justify-center text-cyan-200 text-xs shadow transition active:scale-95 cursor-pointer font-black"
                title="آموزش کامل بازی برای کاربران نوپا 🎓"
              >
                🎓
              </button>
            )}

            {user && (
              <button
                onClick={() => {
                  sound.play('click');
                  if (onOpenGifts) onOpenGifts();
                }}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs shadow transition active:scale-95 relative cursor-pointer ${
                  unclaimedGiftsCount > 0
                    ? 'bg-purple-900 border-purple-400 text-purple-200 animate-bounce ring-2 ring-purple-400/50'
                    : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
                }`}
                title="صندوق هدایا و جوایز رویدادها"
              >
                <span>🎁</span>
                {unclaimedGiftsCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center absolute -top-1 -right-1 shadow">
                    {unclaimedGiftsCount}
                  </span>
                )}
              </button>
            )}

            {user && (
              <button
                onClick={() => {
                  sound.play('click');
                  if (onOpenProfile) onOpenProfile();
                  else onOpenAuth();
                }}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 flex items-center justify-center text-amber-300 text-xs shadow transition active:scale-95 cursor-pointer"
                title="پروفایل کاربری"
              >
                👤
              </button>
            )}

            <button
              onClick={() => {
                sound.play('click');
                onTabChange('editor');
              }}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs shadow transition active:scale-95 cursor-pointer ${
                currentTab === 'editor'
                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                  : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700'
              }`}
              title="ادیتور کارت و تنظیمات بازی"
            >
              🛠️
            </button>

            <button
              onClick={() => {
                sound.play('click');
                onOpenSettings();
              }}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 flex items-center justify-center text-stone-300 text-xs shadow transition active:scale-95 cursor-pointer"
              title="تنظیمات صدا و موسیقی"
            >
              ⚙️
            </button>

            {user && (
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-rose-950 border border-stone-700 hover:border-rose-700 flex items-center justify-center text-stone-400 hover:text-white text-xs shadow transition active:scale-95 cursor-pointer"
                title="خروج از حساب"
              >
                🚪
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= HIGH-END ILLUSTRATED BOTTOM NAVIGATION DOCK ================= */}
      {currentTab !== 'battle' && (
        <nav className="fixed bottom-0 inset-x-0 bg-stone-950/95 border-t-2 border-amber-500/40 backdrop-blur-2xl z-40 px-2 pt-1.5 pb-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.85)]">
          <div className="max-w-2xl mx-auto flex items-center justify-start sm:justify-around gap-1.5 px-1 overflow-x-auto no-scrollbar scroll-smooth">
            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.play('click');
                    onTabChange(item.id);
                  }}
                  className={`relative shrink-0 flex-1 min-w-[62px] sm:min-w-[68px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 cursor-pointer ${
                    isActive
                      ? `bg-gradient-to-b ${item.glowColor} text-amber-300 font-black border-2 shadow-lg shadow-amber-500/30 scale-105`
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60 border border-stone-800/80'
                  }`}
                  title={item.label}
                >
                  {/* Top Glowing Indicator for Active Tab */}
                  {isActive && (
                    <span className="w-4 h-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 absolute -top-1 shadow-[0_0_8px_#f59e0b]" />
                  )}

                  {/* High-Resolution Thumbnail Graphic Frame */}
                  <div
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center border transition-all duration-200 shadow-md ${
                      isActive
                        ? 'border-amber-300 ring-2 ring-amber-400/70 scale-110 shadow-amber-500/40'
                        : 'border-stone-700 bg-stone-900 group-hover:border-stone-500'
                    }`}
                  >
                    <img
                      src={item.img}
                      alt={item.label}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Fallback Icon overlay if image fails or for styling */}
                    <span className="hidden absolute inset-0 text-sm items-center justify-center">
                      {item.icon}
                    </span>
                  </div>

                  {/* Button Label */}
                  <span
                    className={`text-[9px] sm:text-[10px] tracking-tight truncate w-full text-center leading-none ${
                      isActive ? 'font-black text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'font-bold'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
