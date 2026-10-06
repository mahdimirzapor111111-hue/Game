import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, AuthScreenConfig } from '../types/game';
import {
  loadAllUsers,
  saveAllUsers,
  setActiveUserId,
  FRESH_MYTHICAL_CARDS,
  DEFAULT_GAME_IMAGES,
  loadAuthConfig,
} from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS } from '../assets/visuals';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_GAME_IMAGES[0]?.url || GAME_VISUALS.rostam);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthScreenConfig>(() => loadAuthConfig());

  useEffect(() => {
    if (isOpen) {
      setAuthConfig(loadAuthConfig());
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const u = username.trim();
    const p = password.trim();
    if (!u || !p) {
      setError('نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    const users = loadAllUsers();

    // Check for admin login with Mahdimirzapor / Mahdimirzapor (case-insensitive username)
    const isAdminCredentials = u.toLowerCase() === 'mahdimirzapor' && p === 'Mahdimirzapor';

    let found: UserProfile | undefined;

    if (isAdminCredentials) {
      found = users.find((user) => user.username.toLowerCase() === 'mahdimirzapor');
      if (!found) {
        // Fallback: create or find admin
        found = users.find((user) => user.role === 'admin');
        if (found) {
          found.username = 'Mahdimirzapor';
          found.password = 'Mahdimirzapor';
        }
      }
      if (found) {
        found.role = 'admin';
        found.password = 'Mahdimirzapor';
      }
    } else {
      found = users.find(
        (user) => user.username.toLowerCase() === u.toLowerCase() && user.password === p
      );
    }

    if (!found) {
      setError('نام کاربری یا کلمه عبور نادرست است.');
      return;
    }

    if (found.isBanned) {
      sound.play('death');
      setError(`حساب شما مسدود شده است: ${found.banReason || 'نقض قوانین بازی'}`);
      return;
    }

    found.lastLogin = Date.now();
    saveAllUsers(users);
    setActiveUserId(found.id);
    sound.play('victory');
    setSuccessMsg(
      found.role === 'admin'
        ? `خوش آمدید مدیر ارشد ${found.displayName}!`
        : `خوش آمدید پهلوان ${found.displayName}!`
    );
    setTimeout(() => {
      onLoginSuccess(found!);
      onClose();
    }, 450);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const u = username.trim();
    const p = password.trim();
    const d = displayName.trim() || u;

    if (!u || !p) {
      setError('تمام فیلدها را کامل کنید.');
      return;
    }
    if (u.length < 3) {
      setError('نام کاربری حداقل باید ۳ حرف باشد.');
      return;
    }
    if (u.toLowerCase() === 'mahdimirzapor' || u.toLowerCase() === 'admin') {
      setError('این نام کاربری مختص مدیریت سامانه است.');
      return;
    }

    const users = loadAllUsers();
    if (users.some((x) => x.username.toLowerCase() === u.toLowerCase())) {
      setError('این نام کاربری قبلاً ثبت شده است.');
      return;
    }

    // Regular users are strictly players
    const role: UserRole = 'player';

    const starterDeck = [
      [FRESH_MYTHICAL_CARDS[3]?.id || null, null, FRESH_MYTHICAL_CARDS[4]?.id || null],
      [
        FRESH_MYTHICAL_CARDS[1]?.id || null,
        FRESH_MYTHICAL_CARDS[6]?.id || null,
        FRESH_MYTHICAL_CARDS[2]?.id || null,
      ],
      [null, FRESH_MYTHICAL_CARDS[0]?.id || null, null],
    ];

    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      username: u,
      password: p,
      displayName: d,
      role: role,
      level: 1,
      xp: 0,
      gold: 800,
      gems: 15,
      usd: 0,
      trophies: 150,
      wins: 0,
      losses: 0,
      totalDamage: 0,
      unlockedCardIds: [
        FRESH_MYTHICAL_CARDS[0].id,
        FRESH_MYTHICAL_CARDS[1].id,
        FRESH_MYTHICAL_CARDS[2].id,
        FRESH_MYTHICAL_CARDS[3].id,
        FRESH_MYTHICAL_CARDS[4].id,
      ],
      activeDeck: starterDeck,
      cardProgress: {},
      campaignCompletedIndex: 0,
      avatar: avatar,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      clanId: null,
      clanRole: null,
      lastClanLeaveTimestamp: null,
    };

    users.push(newUser);
    saveAllUsers(users);
    setActiveUserId(newUser.id);
    sound.play('coin');
    setSuccessMsg('پهلوان گرامی، حساب کاربری شما با موفقیت ساخته شد!');
    setTimeout(() => {
      onLoginSuccess(newUser);
      onClose();
    }, 600);
  };

  const bgImageSrc = authConfig.bgImage || GAME_VISUALS.authBg;
  const buttonSealImg = authConfig.buttonBannerImage || GAME_VISUALS.royalSealButton;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Blurred Full Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Dialog Container with Custom Persian Background Art */}
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border-2 border-amber-500/80 text-stone-100 flex flex-col z-10 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Scenic Background Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={bgImageSrc}
            alt="Darbare Nabard"
            className="w-full h-full object-cover scale-105 filter brightness-[0.4] contrast-125"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/80 to-stone-950/95"
            style={{
              opacity: (authConfig.overlayDarkness ?? 75) / 100,
            }}
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-5 sm:p-7 flex flex-col gap-4 max-h-[88vh] overflow-y-auto no-scrollbar">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-amber-500/30 transition cursor-pointer shadow-lg z-20"
            title="بستن"
          >
            ✕
          </button>

          {/* Header Banner */}
          <div className="flex flex-col items-center text-center pt-2">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-2xl p-1 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-300 flex items-center justify-center overflow-hidden">
                <img
                  src={buttonSealImg}
                  alt="Royal Seal"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 text-sm bg-stone-950 px-1.5 py-0.5 rounded-full border border-amber-400 shadow">
                👑
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {mode === 'login' ? authConfig.title || 'ورود به دربار نبرد پادشاهان' : 'ثبت‌نام پهلوان جدید'}
            </h2>
            <p className="text-xs text-amber-200/80 mt-1 max-w-sm drop-shadow">
              {authConfig.subtitle || 'دسترسی به تمام بخش‌های بازی، ذخیره ارتش، مسابقات و اتحادیه'}
            </p>
          </div>

          {/* Active User Card if already signed in */}
          {currentUser && (
            <div className="bg-stone-900/85 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <UserAvatar avatar={currentUser.avatar} size="md" />
                <div>
                  <div className="text-sm font-bold text-amber-300">{currentUser.displayName}</div>
                  <div className="text-[11px] text-stone-400">
                    سطح {currentUser.level} | کاپ {currentUser.trophies || 150}
                  </div>
                </div>
              </div>
              <span className="text-xs bg-emerald-950/90 text-emerald-300 border border-emerald-700 px-2.5 py-1 rounded-xl font-bold">
                حساب متصل
              </span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex bg-stone-950/80 backdrop-blur-md rounded-2xl p-1 border border-amber-500/30 shadow-inner">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_2px_10px_rgba(245,158,11,0.4)]'
                  : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              <span>🔑</span>
              <span>ورود به حساب</span>
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_2px_10px_rgba(245,158,11,0.4)]'
                  : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              <span>🛡️</span>
              <span>ثبت‌نام جدید</span>
            </button>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs p-3 rounded-2xl text-center shadow-lg animate-shake">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-2xl text-center shadow-lg">
              ✓ {successMsg}
            </div>
          )}

          {/* Forms */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">نام کاربری:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام کاربری شما..."
                    className="w-full bg-stone-950/90 border border-stone-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none transition shadow-inner"
                  />
                  <span className="absolute left-3 top-2.5 text-stone-500 text-sm">👤</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">رمز عبور:</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور..."
                    className="w-full bg-stone-950/90 border border-stone-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none transition shadow-inner"
                  />
                  <span className="absolute left-3 top-2.5 text-stone-500 text-sm">🔒</span>
                </div>
              </div>

              {/* Ornate Action Button with Persian Medallion/Image Accent */}
              <button
                type="submit"
                className="mt-2 w-full relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.6)] transition-all transform active:scale-98 cursor-pointer"
              >
                <div className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 py-3 px-4 rounded-[14px] flex items-center justify-center gap-3">
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-950/50 shadow shrink-0">
                    <img
                      src={buttonSealImg}
                      alt="Button Seal"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-stone-950 font-black text-sm sm:text-base drop-shadow-sm">
                    {authConfig.loginButtonText || 'ورود به دربار 🏰'}
                  </span>
                  <span className="text-base">⚔️</span>
                </div>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  نام نمایشی پهلوان (فارسی):
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثلاً رستم زابلی یا گردآفرید"
                  className="w-full bg-stone-950/90 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  نام کاربری برای ورود (انگلیسی):
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثلاً rostam99"
                  className="w-full bg-stone-950/90 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">کلمه عبور:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۴ نویسه..."
                  className="w-full bg-stone-950/90 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1.5">
                  انتخاب تمثال پهلوان:
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    GAME_VISUALS.rostam,
                    GAME_VISUALS.sohrab,
                    GAME_VISUALS.arash,
                    GAME_VISUALS.kaveh,
                    GAME_VISUALS.simurgh,
                  ].map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(imgUrl)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                        avatar === imgUrl
                          ? 'border-amber-400 ring-2 ring-amber-400 scale-105 shadow-md'
                          : 'border-stone-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Register Button with Image Accent */}
              <button
                type="submit"
                className="mt-2 w-full relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.6)] transition-all transform active:scale-98 cursor-pointer"
              >
                <div className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 py-3 px-4 rounded-[14px] flex items-center justify-center gap-3">
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-950/50 shadow shrink-0">
                    <img
                      src={buttonSealImg}
                      alt="Button Seal"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-stone-950 font-black text-sm sm:text-base drop-shadow-sm">
                    {authConfig.registerButtonText || 'ساخت حساب و شروع نبرد ⚔️'}
                  </span>
                  <span className="text-base">🛡️</span>
                </div>
              </button>
            </form>
          )}

          {/* Footer note: strictly secure and no admin buttons */}
          <div className="pt-2 text-center text-[11px] text-stone-400 border-t border-stone-800/80">
            <span>🛡️ داده‌های حساب کاربری به صورت امن در سامانه ثبت و نگهداری می‌شوند.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
