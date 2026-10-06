import React, { useState } from 'react';
import { AuthScreenConfig } from '../types/game';
import { loadAuthConfig, saveAuthConfig, DEFAULT_AUTH_CONFIG } from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

const BG_PRESETS = [
  { id: 'auth_hall', name: 'کاخ باستانی دربار', url: GAME_VISUALS.authBg },
  { id: 'battle_arena', name: 'میدان نبرد اساطیر', url: GAME_VISUALS.battleArenaBg },
  { id: 'hall_fame', name: 'تالار افتخارات پهلوانان', url: GAME_VISUALS.hallOfFameBanner },
  { id: 'market_bazaar', name: 'بازارچه کهن پارس', url: GAME_VISUALS.marketBazaarBanner },
  { id: 'tourney_arena', name: 'آرنای تورنمنت رستم', url: GAME_VISUALS.tourneyArenaBanner },
  { id: 'clan_hall', name: 'بارگاه اتحادیه پهلوانان', url: GAME_VISUALS.clanBannerHall },
];

const BUTTON_SEAL_PRESETS = [
  { id: 'royal_seal', name: 'نشان زرین شاهنشاهی', url: GAME_VISUALS.royalSealButton },
  { id: 'swords', name: 'شمشیرهای دوگانه زرین', url: GAME_VISUALS.duelSwordsIcon },
  { id: 'gold_coin', name: 'سکه سلطنتی پهلوی', url: GAME_VISUALS.coinIcon },
  { id: 'crown_imperial', name: 'تاج کیانی رتبه یک', url: GAME_VISUALS.crownGoldImperial },
  { id: 'diadem', name: 'تاج یاقوت قهرمانان', url: GAME_VISUALS.crownTopChampion },
  { id: 'mace', name: 'گرز گاوسار رستم', url: GAME_VISUALS.clanMace },
];

export const AuthEditorSection: React.FC = () => {
  const [config, setConfig] = useState<AuthScreenConfig>(() => loadAuthConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [customSealUrl, setCustomSealUrl] = useState('');
  const [previewMode, setPreviewMode] = useState<'login' | 'register'>('login');

  const handleSave = () => {
    saveAuthConfig(config);
    sound.play('coin');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_AUTH_CONFIG });
    saveAuthConfig(DEFAULT_AUTH_CONFIG);
    sound.play('select');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setConfig((prev) => ({ ...prev, bgImage: result }));
        sound.play('select');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSeal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setConfig((prev) => ({ ...prev, buttonBannerImage: result }));
        sound.play('select');
      }
    };
    reader.readAsDataURL(file);
  };

  const bgImageSrc = config.bgImage || GAME_VISUALS.authBg;
  const buttonSealImg = config.buttonBannerImage || GAME_VISUALS.royalSealButton;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
            <span>🔐</span>
            <span>مدیریت و شخصی‌سازی صفحه ورود و ثبت‌نام (Auth Portal)</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            تنظیم عکس پس‌زمینه با کیفیت، نشان و دکمه‌های گرافیکی، تاریکی زمینه و متون دربار
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition border border-stone-700 cursor-pointer"
          >
            بازنشانی به پیش‌فرض
          </button>
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs shadow-lg transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>💾</span>
            <span>ذخیره تغییرات</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs p-3.5 rounded-2xl text-center shadow-lg animate-in fade-in">
          ✓ تنظیمات صفحه ورود و ثبت‌نام با موفقیت ذخیره شد و اعمال گردید!
        </div>
      )}

      {/* Main Grid: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Section 1: Background Image Setting */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3.5">
            <h3 className="text-sm font-black text-amber-300 border-b border-stone-800 pb-2 flex items-center gap-2">
              <span>🖼️</span>
              <span>تصویر پس‌زمینه درگاه ورود (Background Art)</span>
            </h3>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BG_PRESETS.map((p) => {
                const isSelected = config.bgImage === p.url;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setConfig({ ...config, bgImage: p.url });
                      sound.play('click');
                    }}
                    className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer group transition-all duration-200 aspect-[16/10] ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400 scale-[1.02] shadow-lg'
                        : 'border-stone-800 hover:border-stone-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent pointer-events-none" />
                    <span className="absolute bottom-1.5 right-2 left-2 text-[10px] font-bold text-stone-200 truncate text-right">
                      {p.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-500 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-md shadow">
                        فعال
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom URL & Upload */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                placeholder="یا آدرس تصویر اینترنتی (URL) دلخواه..."
                value={customBgUrl}
                onChange={(e) => setCustomBgUrl(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customBgUrl.trim()) {
                    setConfig({ ...config, bgImage: customBgUrl.trim() });
                    setCustomBgUrl('');
                    sound.play('select');
                  }
                }}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-xl font-bold transition cursor-pointer"
              >
                اعمال آدرس
              </button>
              <label className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs rounded-xl font-bold transition flex items-center justify-center cursor-pointer">
                <span>📁 آپلود عکس</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBg}
                  className="hidden"
                />
              </label>
            </div>

            {/* Darkness Slider */}
            <div className="pt-2 border-t border-stone-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold text-stone-300">
                <span>میزان تیرگی پس‌زمینه (خوانایی فرم):</span>
                <span className="text-amber-400">{config.overlayDarkness ?? 75}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={95}
                step={5}
                value={config.overlayDarkness ?? 75}
                onChange={(e) =>
                  setConfig({ ...config, overlayDarkness: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Button Seal & Graphic Icon */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3.5">
            <h3 className="text-sm font-black text-amber-300 border-b border-stone-800 pb-2 flex items-center gap-2">
              <span>🛡️</span>
              <span>نشان گرافیکی و تصویر دکمه‌های ورود (Button Seal Art)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BUTTON_SEAL_PRESETS.map((s) => {
                const isSelected = config.buttonBannerImage === s.url;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setConfig({ ...config, buttonBannerImage: s.url });
                      sound.play('click');
                    }}
                    className={`flex items-center gap-2 p-2 rounded-2xl border-2 cursor-pointer transition ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-md'
                        : 'border-stone-800 bg-stone-950/60 hover:border-stone-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-amber-500/40">
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-stone-200 truncate text-right">
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                placeholder="یا آدرس تصویر نشان دلخواه..."
                value={customSealUrl}
                onChange={(e) => setCustomSealUrl(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSealUrl.trim()) {
                    setConfig({ ...config, buttonBannerImage: customSealUrl.trim() });
                    setCustomSealUrl('');
                    sound.play('select');
                  }
                }}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-xl font-bold transition cursor-pointer"
              >
                اعمال نشان
              </button>
              <label className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs rounded-xl font-bold transition flex items-center justify-center cursor-pointer">
                <span>📁 آپلود نشان</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadSeal}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Text & Titles Settings */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3.5">
            <h3 className="text-sm font-black text-amber-300 border-b border-stone-800 pb-2 flex items-center gap-2">
              <span>✍️</span>
              <span>عناوین و نوشته‌های دربار</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-stone-300 font-bold block mb-1">عنوان اصلی صفحه:</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-300 font-bold block mb-1">متن دکمه ورود:</label>
                <input
                  type="text"
                  value={config.loginButtonText}
                  onChange={(e) => setConfig({ ...config, loginButtonText: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-stone-300 font-bold block mb-1">زیرعنوان و توضیحات:</label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-stone-300 font-bold block mb-1">متن دکمه ثبت‌نام:</label>
                <input
                  type="text"
                  value={config.registerButtonText}
                  onChange={(e) => setConfig({ ...config, registerButtonText: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Admin Credentials & Security Notice */}
          <div className="bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border border-amber-500/40 rounded-3xl p-5 shadow-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
              <span>👑</span>
              <span>مشخصات اختصاصی ورود مدیر کل (Admin Access)</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              جهت امنیت کامل سامانه، دسترسی عمومی و دکمه‌های مهمان برای مدیریت کل برداشته شده و
              برای سایر بازیکنان نمایش داده نمی‌شود. تنها با ورود مشخصات زیر می‌توانید به پنل مدیریت
              کل وارد شوید:
            </p>
            <div className="bg-stone-950/90 p-3 rounded-2xl border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-400">نام کاربری ادمین:</span>
                <code className="text-amber-300 font-black bg-stone-900 px-2 py-0.5 rounded border border-amber-500/30">
                  Mahdimirzapor
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400">رمز عبور ادمین:</span>
                <code className="text-amber-300 font-black bg-stone-900 px-2 py-0.5 rounded border border-amber-500/30">
                  Mahdimirzapor
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview on Right (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-stone-900/90 border border-stone-800 rounded-2xl px-4 py-2.5 shadow">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <span>👁️</span>
              <span>پیش‌نمایش زنده صفحه ورود و ثبت‌نام</span>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewMode('login')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  previewMode === 'login'
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                حالت ورود
              </button>
              <button
                onClick={() => setPreviewMode('register')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  previewMode === 'register'
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                حالت ثبت‌نام
              </button>
            </div>
          </div>

          {/* Mock Auth Dialog Container */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/70 text-stone-100 flex flex-col min-h-[460px]">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
              <img
                src={bgImageSrc}
                alt="Preview Background"
                className="w-full h-full object-cover scale-105 filter brightness-[0.4] contrast-125"
              />
              <div
                className="absolute inset-0 bg-stone-950/90"
                style={{ opacity: (config.overlayDarkness ?? 75) / 100 }}
              />
            </div>

            {/* Mock Dialog Content */}
            <div className="relative z-10 p-5 flex flex-col gap-3.5">
              <div className="flex flex-col items-center text-center pt-1">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-2xl p-1 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 flex items-center justify-center overflow-hidden">
                    <img
                      src={buttonSealImg}
                      alt="Royal Seal"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs bg-stone-950 px-1 py-0.2 rounded-full border border-amber-400">
                    👑
                  </span>
                </div>

                <h3 className="text-base font-black text-amber-300 drop-shadow">
                  {previewMode === 'login'
                    ? config.title || 'ورود به دربار نبرد پادشاهان'
                    : 'ثبت‌نام پهلوان جدید'}
                </h3>
                <p className="text-[11px] text-amber-200/80 mt-0.5 max-w-xs drop-shadow">
                  {config.subtitle}
                </p>
              </div>

              {/* Mock Tabs */}
              <div className="flex bg-stone-950/80 rounded-xl p-0.5 border border-amber-500/30">
                <div
                  className={`flex-1 py-1.5 text-[11px] font-black rounded-lg text-center ${
                    previewMode === 'login'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950'
                      : 'text-stone-400'
                  }`}
                >
                  ورود به حساب
                </div>
                <div
                  className={`flex-1 py-1.5 text-[11px] font-black rounded-lg text-center ${
                    previewMode === 'register'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950'
                      : 'text-stone-400'
                  }`}
                >
                  ثبت‌نام جدید
                </div>
              </div>

              {/* Mock Form Inputs */}
              <div className="flex flex-col gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-amber-200 font-bold block mb-0.5">نام کاربری:</span>
                  <div className="w-full bg-stone-950/80 border border-stone-700 rounded-xl px-3 py-2 text-stone-400 text-xs">
                    {previewMode === 'login' ? 'Mahdimirzapor' : 'نام کاربری دلخواه'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-amber-200 font-bold block mb-0.5">رمز عبور:</span>
                  <div className="w-full bg-stone-950/80 border border-stone-700 rounded-xl px-3 py-2 text-stone-400 text-xs">
                    ••••••••••••
                  </div>
                </div>

                {/* Submit Button with Seal Icon */}
                <div className="mt-2 w-full relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.4)]">
                  <div className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-2.5 px-3 rounded-[14px] flex items-center justify-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg overflow-hidden border border-amber-950/50 shadow shrink-0">
                      <img src={buttonSealImg} alt="Seal" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-stone-950 font-black text-xs">
                      {previewMode === 'login'
                        ? config.loginButtonText || 'ورود به دربار 🏰'
                        : config.registerButtonText || 'ساخت حساب و شروع نبرد ⚔️'}
                    </span>
                    <span className="text-xs">⚔️</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-2 text-center text-[10px] text-stone-400 border-t border-stone-800/80">
                🛡️ داده‌های حساب کاربری به صورت امن ذخیره می‌شوند
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
