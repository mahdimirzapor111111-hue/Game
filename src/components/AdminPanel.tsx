import React, { useState } from 'react';
import {
  UserProfile,
  CardDef,
  AllPagesConfig,
  StageDef,
} from '../types/game';
import { CardEditorScreen } from './CardEditorScreen';
import { ChestEditorScreen } from './ChestEditorScreen';
import { EventEditorScreen } from './EventEditorScreen';
import { UsdAdminFinancePanel } from './UsdAdminFinancePanel';
import {
  wipeAllCards,
  seedFreshMythicalCards,
  loadAllUsers,
  toggleUserBan,
  sendGiftToUser,
  updateFullUserProfile,
  deleteUserAccount,
  savePagesConfig,
} from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS } from '../assets/visuals';

interface AdminPanelProps {
  user: UserProfile;
  cardLibrary: CardDef[];
  pagesConfig: AllPagesConfig;
  stages: StageDef[];
  onUpdateCards: (cards: CardDef[]) => void;
  onUpdatePagesConfig: (cfg: AllPagesConfig) => void;
  onUpdateStages: (stages: StageDef[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  cardLibrary,
  pagesConfig,
  onUpdateCards,
  onUpdatePagesConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'chests' | 'events' | 'cards' | 'visuals' | 'usd'>('users');
  const [usersList, setUsersList] = useState<UserProfile[]>(() => loadAllUsers());
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // User Ban Modal State
  const [banningUser, setBanningUser] = useState<UserProfile | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('نقض قوانین بازی و تقلب در نبردها');

  // Gift Modal State
  const [giftingUser, setGiftingUser] = useState<UserProfile | null>(null);
  const [giftGold, setGiftGold] = useState<number>(500);
  const [giftGems, setGiftGems] = useState<number>(10);
  const [giftTrophies, setGiftTrophies] = useState<number>(50);
  const [giftCardId, setGiftCardId] = useState<string>('');
  const [giftMessage, setGiftMessage] = useState<string>('هدیه ویژه از طرف مدیریت بازی شاهنامه!');

  // Page Visuals State
  const [draftConfig, setDraftConfig] = useState<AllPagesConfig>(() => JSON.parse(JSON.stringify(pagesConfig)));
  const [visualNotice, setVisualNotice] = useState<string | null>(null);

  const refreshUsers = () => {
    setUsersList(loadAllUsers());
  };

  if (user.role !== 'admin') {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-100">
        <div className="text-5xl mb-2">🚫</div>
        <h2 className="text-xl font-bold text-rose-500">دسترسی به پنل مدیریت کل محدود است</h2>
      </div>
    );
  }

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateFullUserProfile(editingUser.id, editingUser);
    sound.play('coin');
    refreshUsers();
    setEditingUser(null);
    alert(`اطلاعات کاربر ${editingUser.displayName} با موفقیت ذخیره شد.`);
  };

  const handleToggleCardUnlockForUser = (cardId: string) => {
    if (!editingUser) return;
    const current = editingUser.unlockedCardIds || [];
    const has = current.includes(cardId);
    const next = has ? current.filter((c) => c !== cardId) : [...current, cardId];
    setEditingUser({ ...editingUser, unlockedCardIds: next });
  };

  const handleConfirmBanToggle = (isBanned: boolean) => {
    if (!banningUser) return;
    toggleUserBan(banningUser.id, isBanned, banReasonInput);
    sound.play(isBanned ? 'death' : 'victory');
    refreshUsers();
    setBanningUser(null);
    alert(isBanned ? `کاربر ${banningUser.displayName} با موفقیت مسدود شد.` : `انسداد کاربر ${banningUser.displayName} برطرف شد.`);
  };

  const handleSendGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftingUser) return;
    sendGiftToUser(giftingUser.id, {
      senderName: 'مدیریت بازی شاهنامه',
      message: giftMessage,
      gold: giftGold,
      gems: giftGems,
      trophies: giftTrophies,
      cardIds: giftCardId ? [giftCardId] : [],
    });
    sound.play('victory');
    refreshUsers();
    setGiftingUser(null);
    alert(`بسته هدیه با موفقیت به صندوق هدایای کاربر «${giftingUser.displayName}» ارسال شد.`);
  };

  const handleDeleteUser = (target: UserProfile) => {
    if (confirm(`آیا از حذف کامل حساب کاربری «${target.displayName}» اطمینان دارید؟ این عمل غیرقابل بازگشت است.`)) {
      const ok = deleteUserAccount(target.id);
      if (ok) {
        sound.play('hit');
        refreshUsers();
        alert('حساب کاربری حذف گردید.');
      } else {
        alert('خطا در حذف کاربر.');
      }
    }
  };

  const handleWipeAll = () => {
    if (confirm('هشدار: آیا مطمئن هستید که می‌خواهید تمام کارت‌ها را پاک‌سازی کنید؟')) {
      wipeAllCards();
      onUpdateCards([]);
      sound.play('death');
    }
  };

  const handleSeedFresh = () => {
    const fresh = seedFreshMythicalCards();
    onUpdateCards(fresh);
    sound.play('victory');
  };

  const handleSaveAllVisuals = () => {
    savePagesConfig(draftConfig);
    onUpdatePagesConfig(draftConfig);
    sound.play('victory');
    setVisualNotice('تنظیمات ظاهری و تصاویر تمام صفحات بازی ذخیره و اعمال شد!');
    setTimeout(() => setVisualNotice(null), 3500);
  };

  const filteredUsers = usersList.filter((u) =>
    u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.title && u.title.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  return (
    <div className="w-full flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto select-none bg-stone-950 text-stone-100 pb-24">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
        {/* Header Console Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-500/40 pb-4 bg-stone-900/90 p-4 rounded-3xl border shadow-xl">
          <div className="flex items-center gap-3">
            <img src={GAME_VISUALS.crownRankIcon} alt="Crown" className="w-12 h-12 rounded-2xl shadow-lg border border-amber-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300">
                فرمانروایی و پنل مدیریت کل بازی شاهنامه
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                نظارت بر بازیکنان، تنظیم کارت‌ها و شانس صندوق‌ها، مسابقات و تغییر تصاویر محیطی
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleWipeAll}
              className="bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer"
            >
              پاک‌سازی کل کارت‌ها
            </button>
            <button
              onClick={handleSeedFresh}
              className="bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer"
            >
              بارگذاری کارت‌های اولیه شاهنامه
            </button>
          </div>
        </div>

        {/* Navigation Tabs in Admin */}
        <div className="flex bg-stone-900 p-1.5 rounded-2xl border border-stone-800 gap-1.5 overflow-x-auto">
          {[
            { id: 'users' as const, label: 'مدیریت کاربران و بازیکنان', iconImg: GAME_VISUALS.clanShieldIcon },
            { id: 'visuals' as const, label: 'ویرایش تصاویر و محیط بازی', iconImg: GAME_VISUALS.battleArenaBg },
            { id: 'chests' as const, label: 'ادیتور صندوق‌های شانس', iconImg: GAME_VISUALS.shopChestBanner },
            { id: 'events' as const, label: 'مدیریت جام‌ها و مسابقات', iconImg: GAME_VISUALS.trophyEventsIcon },
            { id: 'cards' as const, label: 'ادیتور کارت‌ها و گالری', iconImg: GAME_VISUALS.deckSwordsIcon },
            { id: 'usd' as const, label: 'معاملات دلاری و چت کاربران', iconImg: GAME_VISUALS.usdIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-stone-950 shadow-lg font-black border border-amber-300'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <img src={tab.iconImg} alt="Tab" className="w-4 h-4 rounded-full object-cover" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: USERS MANAGEMENT CONSOLE */}
        {activeTab === 'users' && (
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <img src={GAME_VISUALS.clanShieldIcon} alt="Users" className="w-5 h-5 rounded-full" />
                  <span>لیست حساب‌های کاربری ({usersList.length} کاربر)</span>
                </h3>
              </div>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا نام‌کاربری..."
                className="w-full sm:w-64 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredUsers.map((u) => {
                const isMe = u.id === user.id;
                const isBanned = !!u.isBanned;

                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-3xl border flex flex-col justify-between gap-3 transition shadow-lg ${
                      isBanned
                        ? 'bg-rose-950/30 border-rose-800/80'
                        : isMe
                        ? 'bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-400/40'
                        : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar avatar={u.avatar} size="lg" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-stone-100">{u.displayName}</span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full shadow">
                                مدیر کل 👑
                              </span>
                            )}
                            {isBanned && (
                              <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full shadow animate-pulse">
                                مسدود 🚫
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-400 block mt-0.5">
                            @{u.username} {u.title && `• ${u.title}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-left font-mono text-xs">
                        <span className="text-amber-400 font-bold block">{u.gold} 💰</span>
                        <span className="text-cyan-400 font-bold block">{u.gems} 💎</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 bg-stone-900/90 p-2.5 rounded-2xl text-center text-[11px] border border-stone-800/80">
                      <div>
                        <span className="text-stone-400 block text-[10px]">سطح</span>
                        <span className="font-black text-stone-200">{u.level}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">کاپ 🏆</span>
                        <span className="font-black text-amber-400">{u.trophies || 0}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">برد / باخت</span>
                        <span className="font-black text-emerald-400">
                          {u.wins} / <span className="text-rose-400">{u.losses}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">کارت‌ها</span>
                        <span className="font-black text-purple-300">{u.unlockedCardIds.length}</span>
                      </div>
                    </div>

                    {isBanned && u.banReason && (
                      <div className="text-[11px] text-rose-300 bg-rose-950/60 p-2 rounded-xl border border-rose-800">
                        علت مسدودیت: {u.banReason}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-800/80 flex-wrap">
                      <button
                        onClick={() => {
                          setEditingUser(JSON.parse(JSON.stringify(u)));
                          sound.play('select');
                        }}
                        className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs py-2 rounded-xl transition border border-stone-700 cursor-pointer"
                      >
                        ویرایش کاربر ✏️
                      </button>

                      <button
                        onClick={() => {
                          setGiftingUser(u);
                          setGiftGold(500);
                          setGiftGems(10);
                          setGiftTrophies(50);
                          setGiftCardId('');
                          sound.play('coin');
                        }}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                        title="ارسال بسته هدیه، طلا، الماس یا کارت"
                      >
                        <img src={GAME_VISUALS.shopChestBanner} alt="Gift" className="w-4 h-4 rounded-full" />
                        <span>ارسال هدیه</span>
                      </button>

                      {isBanned ? (
                        <button
                          onClick={() => {
                            setBanningUser(u);
                            setBanReasonInput('');
                          }}
                          className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          رفع انسداد 🔓
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setBanningUser(u);
                            setBanReasonInput('نقض قوانین بازی و تقلب در نبردها');
                          }}
                          className="bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          مسدودسازی 🚫
                        </button>
                      )}

                      {!isMe && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-rose-300 text-xs px-3 py-2 rounded-xl transition border border-stone-700 cursor-pointer"
                          title="حذف کامل حساب"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VISUALS & ENVIRONMENT CUSTOMIZER */}
        {activeTab === 'visuals' && (
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 flex flex-col gap-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <img src={GAME_VISUALS.battleArenaBg} alt="Visuals" className="w-6 h-6 rounded-full object-cover" />
                  <span>شخصی‌سازی تصاویر محیطی، پس‌زمینه‌ها و سربرگ‌های بازی</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  می‌توانید تصویر پس‌زمینه میدان رزم، نقشه داستان، میز چیدمان و بازارچه را تغییر دهید
                </p>
              </div>
              <button
                onClick={handleSaveAllVisuals}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <img src={GAME_VISUALS.coinIcon} alt="Save" className="w-4 h-4 rounded-full" />
                <span>ذخیره تغییرات ظاهری 💾</span>
              </button>
            </div>

            {visualNotice && (
              <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-3.5 rounded-2xl text-center font-bold shadow animate-in fade-in">
                {visualNotice}
              </div>
            )}

            {/* Section 1: Battle Arena Background */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-black text-sm text-amber-300 flex items-center gap-2">
                  <span>⚔️</span>
                  <span>تصویر زمینه میدان نبرد (Battle Arena):</span>
                </span>
                <span className="text-xs text-stone-400">نمایش در مبارزات و دوئل‌ها</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'arena_default', label: 'میدان سنگی باستانی', url: GAME_VISUALS.battleArenaBg },
                  { id: 'arena_events', label: 'تالار قهرمانان و مشعل‌ها', url: GAME_VISUALS.eventsArenaBanner },
                  { id: 'arena_clan', label: 'کاخ باشکوه شاهان', url: GAME_VISUALS.clanHallArt },
                  { id: 'arena_quest', label: 'دشت نبرد اساطیری', url: GAME_VISUALS.campaignQuestArt },
                ].map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setDraftConfig({
                        ...draftConfig,
                        battlePage: { ...draftConfig.battlePage, bgImage: preset.url },
                      });
                      sound.play('select');
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition ${
                      draftConfig.battlePage.bgImage === preset.url
                        ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover rounded-lg" />
                    <span className="text-[10px] font-bold text-stone-300 text-center truncate w-full">{preset.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 text-xs">
                <input
                  type="text"
                  value={draftConfig.battlePage.bgImage || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      battlePage: { ...draftConfig.battlePage, bgImage: e.target.value.trim() || null },
                    })
                  }
                  placeholder="یا لینک تصویر اختصاصی میدان نبرد را وارد کنید..."
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-400"
                />
                <label className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-3.5 py-2 rounded-xl text-xs cursor-pointer shadow">
                  آپلود عکس 📁
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = (ev) => {
                          setDraftConfig({
                            ...draftConfig,
                            battlePage: { ...draftConfig.battlePage, bgImage: ev.target?.result as string },
                          });
                          sound.play('coin');
                        };
                        r.readAsDataURL(f);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Section 2: Campaign Page Background */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-black text-sm text-purple-300 flex items-center gap-2">
                  <span>🗺️</span>
                  <span>تصویر پس‌زمینه نقشه داستان و هفت‌خوان:</span>
                </span>
                <span className="text-xs text-stone-400">بخش مراحل ماجراجویی</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'quest_default', label: 'دشت نبرد اساطیری', url: GAME_VISUALS.campaignQuestArt },
                  { id: 'quest_clan', label: 'دژ دلاوران شاهنامه', url: GAME_VISUALS.clanHallArt },
                  { id: 'quest_arena', label: 'میدان رزم باستانی', url: GAME_VISUALS.battleArenaBg },
                  { id: 'quest_forge', label: 'کارگاه کهن اسطوره‌ها', url: GAME_VISUALS.deckForgeArt },
                ].map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setDraftConfig({
                        ...draftConfig,
                        campaignPage: { ...draftConfig.campaignPage, bgImage: preset.url },
                      });
                      sound.play('select');
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition ${
                      draftConfig.campaignPage.bgImage === preset.url
                        ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-400/50'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover rounded-lg" />
                    <span className="text-[10px] font-bold text-stone-300 text-center truncate w-full">{preset.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 text-xs">
                <input
                  type="text"
                  value={draftConfig.campaignPage.bgImage || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      campaignPage: { ...draftConfig.campaignPage, bgImage: e.target.value.trim() || null },
                    })
                  }
                  placeholder="یا لینک تصویر اختصاصی نقشه مراحل را وارد کنید..."
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Section 3: Deck Builder Background */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-black text-sm text-cyan-300 flex items-center gap-2">
                  <span>🎴</span>
                  <span>تصویر پس‌زمینه میز چیدمان کارت‌ها:</span>
                </span>
                <span className="text-xs text-stone-400">بخش ترکیب و ارتقای ارتش</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'deck_forge', label: 'میز کارگاه باستانی', url: GAME_VISUALS.deckForgeArt },
                  { id: 'deck_hall', label: 'کاخ اساطیر', url: GAME_VISUALS.clanHallArt },
                  { id: 'deck_arena', label: 'میدان رزم', url: GAME_VISUALS.battleArenaBg },
                  { id: 'deck_events', label: 'تالار قهرمانان', url: GAME_VISUALS.eventsArenaBanner },
                ].map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setDraftConfig({
                        ...draftConfig,
                        deckPage: { ...draftConfig.deckPage, bgImage: preset.url },
                      });
                      sound.play('select');
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition ${
                      draftConfig.deckPage.bgImage === preset.url
                        ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/50'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover rounded-lg" />
                    <span className="text-[10px] font-bold text-stone-300 text-center truncate w-full">{preset.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 text-xs">
                <input
                  type="text"
                  value={draftConfig.deckPage.bgImage || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      deckPage: { ...draftConfig.deckPage, bgImage: e.target.value.trim() || null },
                    })
                  }
                  placeholder="یا لینک تصویر اختصاصی میز چیدمان را وارد کنید..."
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHESTS */}
        {activeTab === 'chests' && (
          <ChestEditorScreen cardLibrary={cardLibrary} />
        )}

        {/* TAB 4: EVENTS */}
        {activeTab === 'events' && (
          <EventEditorScreen cardLibrary={cardLibrary} />
        )}

        {/* TAB 5: CARDS */}
        {activeTab === 'cards' && (
          <CardEditorScreen
            cardLibrary={cardLibrary}
            user={user}
            onUpdateCards={onUpdateCards}
          />
        )}

        {/* TAB 6: USD FINANCE & USER CHAT */}
        {activeTab === 'usd' && (
          <UsdAdminFinancePanel currentUser={user} />
        )}
      </div>

      {/* ================= EDIT USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-6 text-stone-100 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <UserAvatar avatar={editingUser.avatar} size="sm" />
                <span>ویرایش اطلاعات کاربر: {editingUser.displayName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-stone-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">نام نمایشی:</label>
                  <input
                    type="text"
                    value={editingUser.displayName}
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">لقب و عنوان:</label>
                  <input
                    type="text"
                    value={editingUser.title || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                    placeholder="مثال: فاتح البرز"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-amber-300 font-bold mb-1">سکه طلا:</label>
                  <input
                    type="number"
                    value={editingUser.gold}
                    onChange={(e) => setEditingUser({ ...editingUser, gold: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 font-bold mb-1">الماس:</label>
                  <input
                    type="number"
                    value={editingUser.gems}
                    onChange={(e) => setEditingUser({ ...editingUser, gems: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-cyan-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 font-bold mb-1">دلار آمریکا ($):</label>
                  <input
                    type="number"
                    value={editingUser.usd || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, usd: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-emerald-400 font-black"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-bold mb-1">کاپ 🏆:</label>
                  <input
                    type="number"
                    value={editingUser.trophies || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, trophies: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">سطح (Level):</label>
                  <input
                    type="number"
                    value={editingUser.level}
                    onChange={(e) => setEditingUser({ ...editingUser, level: parseInt(e.target.value) || 1 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 font-bold mb-1">بردها (Wins):</label>
                  <input
                    type="number"
                    value={editingUser.wins}
                    onChange={(e) => setEditingUser({ ...editingUser, wins: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 font-bold mb-1">باخت‌ها (Losses):</label>
                  <input
                    type="number"
                    value={editingUser.losses}
                    onChange={(e) => setEditingUser({ ...editingUser, losses: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-rose-400"
                  />
                </div>
              </div>

              {/* CARD UNLOCKS TOGGLE */}
              <div className="border-t border-stone-800 pt-2">
                <label className="block text-stone-300 font-bold mb-1.5">
                  کارت‌های بازشده برای این کاربر ({editingUser.unlockedCardIds?.length || 0} کارت):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-stone-950 rounded-xl border border-stone-800">
                  {cardLibrary.map((card) => {
                    const isUnlocked = editingUser.unlockedCardIds?.includes(card.id);
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleToggleCardUnlockForUser(card.id)}
                        className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-between cursor-pointer transition ${
                          isUnlocked
                            ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                            : 'bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-700'
                        }`}
                      >
                        <span className="truncate">{card.name}</span>
                        <span>{isUnlocked ? '✓' : '✕'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-stone-800 text-stone-300 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-5 py-2 rounded-xl shadow cursor-pointer"
                >
                  ذخیره تغییرات 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= GIFT USER MODAL ================= */}
      {giftingUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border-2 border-purple-500/80 rounded-3xl p-6 text-stone-100 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black text-purple-300 flex items-center gap-2">
                <img src={GAME_VISUALS.shopChestBanner} alt="Gift" className="w-6 h-6 rounded-full" />
                <span>ارسال بسته هدیه به: {giftingUser.displayName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setGiftingUser(null)}
                className="text-stone-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendGiftSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">پیام همراه هدیه:</label>
                <input
                  type="text"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 flex items-center gap-1">
                    <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-3.5 h-3.5 rounded-full" />
                    <span>طلا:</span>
                  </label>
                  <input
                    type="number"
                    value={giftGold}
                    onChange={(e) => setGiftGold(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 font-bold mb-1 flex items-center gap-1">
                    <img src={GAME_VISUALS.gemIcon} alt="Gems" className="w-3.5 h-3.5 rounded-full" />
                    <span>الماس:</span>
                  </label>
                  <input
                    type="number"
                    value={giftGems}
                    onChange={(e) => setGiftGems(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-cyan-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-bold mb-1 flex items-center gap-1">
                    <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                    <span>کاپ:</span>
                  </label>
                  <input
                    type="number"
                    value={giftTrophies}
                    onChange={(e) => setGiftTrophies(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">کارت هدیه (اختیاری):</label>
                <select
                  value={giftCardId}
                  onChange={(e) => setGiftCardId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-stone-100"
                >
                  <option value="">بدون کارت هدیه</option>
                  {cardLibrary.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setGiftingUser(null)}
                  className="bg-stone-800 text-stone-300 px-4 py-2 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black px-5 py-2 rounded-xl shadow flex items-center gap-1.5"
                >
                  <img src={GAME_VISUALS.shopChestBanner} alt="Send" className="w-4 h-4 rounded-full" />
                  <span>ارسال بسته به صندوق کاربر 🎁</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BAN USER MODAL ================= */}
      {banningUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 text-stone-100 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-lg font-black text-rose-400">
                {banningUser.isBanned ? 'رفع مسدودیت کاربر' : 'مسدودسازی کاربر (Ban)'}
              </h3>
              <p className="text-xs text-stone-400">
                کاربر: <b className="text-stone-200">{banningUser.displayName}</b> (@{banningUser.username})
              </p>
            </div>

            {!banningUser.isBanned && (
              <div>
                <label className="block text-xs text-stone-300 font-bold mb-1">دلیل مسدودسازی:</label>
                <input
                  type="text"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBanningUser(null)}
                className="flex-1 bg-stone-800 text-stone-300 font-bold text-xs py-2.5 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBanToggle(!banningUser.isBanned)}
                className={`flex-1 font-black text-xs py-2.5 rounded-xl shadow ${
                  banningUser.isBanned
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {banningUser.isBanned ? 'تایید رفع انسداد 🔓' : 'تایید مسدودسازی 🚫'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
