import React, { useState, useEffect } from 'react';
import { UserProfile, GameAssetImage, getLeagueByTrophies } from '../types/game';
import {
  loadGameImages,
  loadAllUsers,
  updateUserProfile,
  loadClans,
  getClanCooldownRemaining,
  addGameImage,
  updateGameImage,
  deleteGameImage,
} from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserUpdate: (u: UserProfile) => void;
  onOpenEditor?: () => void;
  onOpenClan?: () => void;
  onOpenAuth?: () => void;
  onOpenUsdFinance?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdate,
  onOpenClan,
  onOpenAuth,
  onOpenUsdFinance,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🤴');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [gameImages, setGameImages] = useState<GameAssetImage[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Avatar Management & Editing States
  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [editingAvatar, setEditingAvatar] = useState<GameAssetImage | null>(null);
  const [addingAvatarOpen, setAddingAvatarOpen] = useState<boolean>(false);
  const [avatarFormName, setAvatarFormName] = useState('');
  const [avatarFormCategory, setAvatarFormCategory] = useState<'heroes' | 'kings' | 'mages' | 'creatures' | 'custom'>('custom');
  const [avatarFormData, setAvatarFormData] = useState<string | null>(null);
  const [avatarFormUrl, setAvatarFormUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGameImages(loadGameImages());
      if (user) {
        setDisplayName(user.displayName || user.username || '');
        setTitle(user.title || '');
        setBio(user.bio || '');
        setSelectedAvatar(user.avatar || '🤴');
      }
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const currentLeague = getLeagueByTrophies(user.trophies || 0);
  const totalBattles = (user.wins || 0) + (user.losses || 0);
  const winRate = totalBattles > 0 ? Math.round(((user.wins || 0) / totalBattles) * 100) : 0;
  const allClans = loadClans();
  const userClan = user.clanId ? allClans.find((c) => c.id === user.clanId) : null;

  const allUsers = loadAllUsers();
  const sortedUsers = [...allUsers].sort(
    (a, b) => (b.trophies || 150) - (a.trophies || 150) || b.wins - a.wins
  );
  const userRankIndex = sortedUsers.findIndex((u) => u.id === user.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : sortedUsers.length + 1;

  const filteredImages = activeCategory === 'all'
    ? gameImages
    : gameImages.filter((img) => img.category === activeCategory);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim() || user.username || 'پهلوان';
    const updatedUser: UserProfile = {
      ...user,
      displayName: trimmedName,
      title: title.trim(),
      bio: bio.trim(),
      avatar: selectedAvatar,
    };
    updateUserProfile(updatedUser);
    onUserUpdate(updatedUser);
    sound.play('coin');
    setSavedNotice('اطلاعات با موفقیت ذخیره شد!');
    setTimeout(() => {
      setSavedNotice(null);
      onClose();
    }, 1200);
  };

  const handleStartEditAvatar = (img: GameAssetImage, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.play('select');
    setEditingAvatar(img);
    setAvatarFormName(img.name);
    setAvatarFormCategory(img.category);
    setAvatarFormData(img.url.startsWith('data:') ? img.url : null);
    setAvatarFormUrl(img.url.startsWith('data:') ? '' : img.url);
  };

  const handleDeleteAvatar = (img: GameAssetImage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`آیا از حذف تصویر "${img.name}" مطمئن هستید؟`)) return;
    deleteGameImage(img.id);
    const fresh = loadGameImages();
    setGameImages(fresh);
    sound.play('death');

    if (selectedAvatar === img.url) {
      const nextAv = fresh[0]?.url || '🤴';
      setSelectedAvatar(nextAv);
      const updatedUser = { ...user, avatar: nextAv };
      updateUserProfile(updatedUser);
      onUserUpdate(updatedUser);
    }
    setSavedNotice(`تصویر "${img.name}" با موفقیت حذف شد.`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSaveAvatarEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAvatar) return;
    const finalUrl = avatarFormData || avatarFormUrl.trim() || editingAvatar.url;
    const updated: GameAssetImage = {
      ...editingAvatar,
      name: avatarFormName.trim() || editingAvatar.name,
      category: avatarFormCategory,
      url: finalUrl,
    };
    updateGameImage(updated);
    const fresh = loadGameImages();
    setGameImages(fresh);

    if (selectedAvatar === editingAvatar.url) {
      setSelectedAvatar(finalUrl);
      const updatedUser = { ...user, avatar: finalUrl };
      updateUserProfile(updatedUser);
      onUserUpdate(updatedUser);
    }
    sound.play('coin');
    setSavedNotice(`مشخصات تصویر "${updated.name}" به‌روزرسانی شد!`);
    setEditingAvatar(null);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleOpenAddAvatarModal = () => {
    sound.play('select');
    setAddingAvatarOpen(true);
    setAvatarFormName('');
    setAvatarFormCategory('custom');
    setAvatarFormData(null);
    setAvatarFormUrl('');
  };

  const handleSaveNewAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = avatarFormData || avatarFormUrl.trim();
    if (!finalUrl) {
      alert('لطفاً عکسی را انتخاب کرده یا آدرس آن را وارد کنید.');
      return;
    }
    const name = avatarFormName.trim() || 'آواتار اختصاصی';
    const newImage: GameAssetImage = {
      id: 'avatar_' + Date.now(),
      name,
      url: finalUrl,
      category: avatarFormCategory,
      createdAt: Date.now(),
      isCustom: true,
    };
    addGameImage(newImage);
    const fresh = loadGameImages();
    setGameImages(fresh);
    setSelectedAvatar(finalUrl);
    setAddingAvatarOpen(false);
    sound.play('coin');
    setSavedNotice(`تصویر "${name}" با موفقیت اضافه و به عنوان آواتار انتخاب شد!`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 260;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        const ctx = cv.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          const dataUri = cv.toDataURL('image/jpeg', 0.85);
          setAvatarFormData(dataUri);
          setAvatarFormUrl('');
          sound.play('select');
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 text-stone-100 flex flex-col gap-4 shadow-2xl my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300">
                پروفایل پهلوانی و مشخصات دلاور
              </h2>
              <p className="text-[11px] text-stone-400">
                ویرایش نام، عنوان، بیوگرافی و انتخاب تصویر آواتار از گالری
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {savedNotice && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-2xl text-center font-bold animate-in fade-in">
            {savedNotice}
          </div>
        )}

        {/* Hero Card Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-lg">
          <div className="relative">
            <UserAvatar
              avatar={selectedAvatar}
              size="xl"
              className="border-4 border-amber-400 shadow-xl"
              crownRank={userRank <= 10 ? userRank : undefined}
            />
            <span className="absolute -bottom-1 -right-1 text-xs bg-stone-900 rounded-full px-2 py-0.5 border border-amber-400 font-black text-amber-300 shadow">
              سطح {user.level}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-right space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-black text-amber-200">
                {displayName || user.username}
              </h3>
              {title && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {title}
                </span>
              )}
              {user.role === 'admin' && (
                <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow">
                  مدیر کل 👑
                </span>
              )}
            </div>

            <p className="text-xs text-stone-300 italic min-h-[1.2rem]">
              {bio ? `"${bio}"` : 'بدون بیوگرافی'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
              <span className={`px-2 py-0.5 rounded-lg border font-bold text-[11px] ${currentLeague.badgeBg} ${currentLeague.color}`}>
                {currentLeague.icon} {currentLeague.name}
              </span>
              <span className="text-amber-300 font-bold bg-stone-950/80 px-2 py-0.5 rounded-lg border border-amber-500/30">
                🏆 {user.trophies || 0} کاپ
              </span>
              <span className="text-emerald-400 font-bold bg-stone-950/80 px-2 py-0.5 rounded-lg border border-stone-800">
                {user.wins || 0}W / {user.losses || 0}L ({winRate}%)
              </span>
              {userClan ? (
                <span
                  onClick={() => {
                    if (onOpenClan) {
                      onClose();
                      onOpenClan();
                    }
                  }}
                  className="bg-purple-950/80 text-purple-200 border border-purple-500/50 px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-purple-900 transition flex items-center gap-1"
                >
                  <span>{userClan.badge}</span>
                  <span>{userClan.name}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Currency & US Dollar Wallet Section with Direct Admin Actions */}
        <div className="bg-stone-950/90 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-400/60 flex items-center justify-center text-xl shadow">
              💵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-300">کیف پول دلاری ($ USD):</span>
                <span className="text-sm font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/50 shadow">
                  ${user.usd || 0} دلار
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">
                حداقل شارژ: ۱۰ دلار | حداقل برداشت: ۲۰ دلار | تسویه و تایید مستقیم با ادمین
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                onClose();
                if (onOpenUsdFinance) onOpenUsdFinance();
              }}
              className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs px-3 py-2 rounded-xl transition shadow flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>📥</span>
              <span>شارژ / برداشت دلار</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                onClose();
                if (onOpenUsdFinance) onOpenUsdFinance();
              }}
              className="flex-1 sm:flex-none bg-stone-900 hover:bg-stone-800 text-cyan-300 font-bold text-xs px-3 py-2 rounded-xl transition border border-cyan-500/40 shadow flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>💬</span>
              <span>چت با مدیر</span>
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-stone-300 font-bold block mb-1">نام نمایشی:</label>
              <input
                type="text"
                maxLength={25}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثلاً: رستم دستان"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-stone-300 font-bold block mb-1">لقب و عنوان افتخاری:</label>
              <input
                type="text"
                maxLength={30}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: 👑 شاهنشاه اسطوره‌ها"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-stone-300 font-bold block mb-1">بیوگرافی و معرفی کوتاه (Bio):</label>
              <input
                type="text"
                maxLength={80}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="شعار نبرد یا بیوگرافی کوتاه شما..."
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Avatar Selector & Management Box */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <span>🖼️</span>
                  <span>انتخاب یا ویرایش تصویر آواتار ({filteredImages.length} تصویر)</span>
                </h4>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  روی تصویر مورد نظر بزنید تا برای پروفایل شما انتخاب شود
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenAddAvatarModal}
                  className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/60 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow cursor-pointer"
                >
                  <span>+</span>
                  <span>آپلود تصویر جدید</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.play('click');
                    setIsManageMode(!isManageMode);
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow cursor-pointer border ${
                    isManageMode
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                  }`}
                >
                  <span>⚙️</span>
                  <span>{isManageMode ? 'اتمام مدیریت' : 'حالت مدیریت تصاویر'}</span>
                </button>
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-1 text-[10px]">
              {[
                { id: 'all', label: 'همه' },
                { id: 'heroes', label: 'پهلوانان' },
                { id: 'kings', label: 'شاهان' },
                { id: 'mages', label: 'افسونگران' },
                { id: 'creatures', label: 'دیوان' },
                { id: 'custom', label: 'اختصاصی' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition border cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Existing Images Grid with Edit & Delete */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-1">
              {filteredImages.map((img) => {
                const isSelected = selectedAvatar === img.url;
                return (
                  <div
                    key={img.id}
                    onClick={() => {
                      setSelectedAvatar(img.url);
                      sound.play('select');
                    }}
                    className={`flex flex-col items-center justify-between p-2 rounded-2xl cursor-pointer transition relative group ${
                      isSelected
                        ? 'bg-amber-950/80 border-2 border-amber-400 ring-2 ring-amber-400/50 scale-102'
                        : 'bg-stone-900/90 border border-stone-800 hover:border-amber-500/60'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-stone-950 rounded-full flex items-center justify-center font-black text-xs shadow z-10">
                        ✓
                      </span>
                    )}

                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/50 bg-stone-950 flex items-center justify-center shadow">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </div>

                    <span className="text-[10px] text-stone-200 font-bold truncate max-w-full text-center mt-1">
                      {img.name}
                    </span>

                    {/* Quick Edit & Delete Controls */}
                    {isManageMode && (
                      <div className="flex items-center gap-1 w-full pt-1.5 border-t border-stone-800/80 mt-1 justify-center">
                        <button
                          type="button"
                          onClick={(e) => handleStartEditAvatar(img, e)}
                          className="bg-purple-950 hover:bg-purple-900 border border-purple-600/80 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-lg transition cursor-pointer"
                          title="ویرایش نام و عکس"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAvatar(img, e)}
                          className="bg-rose-950 hover:bg-rose-900 border border-rose-600/80 text-rose-300 text-[10px] px-1.5 py-0.5 rounded-lg transition cursor-pointer"
                          title="حذف از گالری"
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-800">
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="text-xs text-stone-400 hover:text-amber-300 underline transition cursor-pointer"
              >
                تغییر حساب / ورود با حساب دیگر
              </button>
            )}

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>💾</span>
                <span>ذخیره پروفایل</span>
              </button>
            </div>
          </div>
        </form>

        {/* MODAL: EDIT AVATAR */}
        {editingAvatar && (
          <div
            onClick={() => setEditingAvatar(null)}
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-stone-900 border-2 border-purple-500 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <h3 className="text-sm font-black text-purple-300">
                    ویرایش تصویر: {editingAvatar.name}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingAvatar(null)}
                  className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAvatarEdit} className="flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-3 bg-stone-950 p-3 rounded-2xl border border-stone-800">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-400 bg-stone-900 flex items-center justify-center shrink-0">
                    <img
                      src={avatarFormData || avatarFormUrl.trim() || editingAvatar.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div>
                      <label className="text-stone-300 font-bold block mb-1">نام تصویر:</label>
                      <input
                        type="text"
                        required
                        maxLength={25}
                        value={avatarFormName}
                        onChange={(e) => setAvatarFormName(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-stone-300 font-bold block mb-1">دسته‌بندی:</label>
                      <select
                        value={avatarFormCategory}
                        onChange={(e) => setAvatarFormCategory(e.target.value as any)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 font-bold"
                      >
                        <option value="heroes">پهلوانان</option>
                        <option value="kings">پادشاهان</option>
                        <option value="mages">افسونگران</option>
                        <option value="creatures">دیوان</option>
                        <option value="custom">اختصاصی</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border border-stone-800 rounded-2xl p-2.5 bg-stone-950/60 flex flex-col gap-1.5">
                  <span className="font-bold text-stone-300">تغییر فایل تصویر از دستگاه:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImageFile}
                    className="text-xs text-stone-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-700 file:text-white cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 pt-1 border-t border-stone-800">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black py-2 rounded-xl shadow-lg transition cursor-pointer"
                  >
                    ذخیره تغییرات 💾
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAvatar(null)}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW AVATAR */}
        {addingAvatarOpen && (
          <div
            onClick={() => setAddingAvatarOpen(false)}
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-stone-900 border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🖼️</span>
                  <h3 className="text-sm font-black text-emerald-300">
                    افزودن و آپلود تصویر آواتار جدید
                  </h3>
                </div>
                <button
                  onClick={() => setAddingAvatarOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNewAvatar} className="flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-3 bg-stone-950 p-3 rounded-2xl border border-stone-800">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400 bg-stone-900 flex items-center justify-center shrink-0">
                    {avatarFormData || avatarFormUrl ? (
                      <img
                        src={avatarFormData || avatarFormUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-stone-600">🖼️</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div>
                      <label className="text-stone-300 font-bold block mb-1">نام یا عنوان تصویر:</label>
                      <input
                        type="text"
                        required
                        maxLength={25}
                        placeholder="مثلاً: رستم جوان"
                        value={avatarFormName}
                        onChange={(e) => setAvatarFormName(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-stone-300 font-bold block mb-1">دسته‌بندی:</label>
                      <select
                        value={avatarFormCategory}
                        onChange={(e) => setAvatarFormCategory(e.target.value as any)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 font-bold"
                      >
                        <option value="heroes">پهلوانان</option>
                        <option value="kings">پادشاهان</option>
                        <option value="mages">افسونگران</option>
                        <option value="creatures">دیوان</option>
                        <option value="custom">اختصاصی</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border border-stone-800 rounded-2xl p-2.5 bg-stone-950/60 flex flex-col gap-1.5">
                  <span className="font-bold text-stone-300">انتخاب فایل از دستگاه:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImageFile}
                    className="text-xs text-stone-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 pt-1 border-t border-stone-800">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black py-2 rounded-xl shadow-lg transition cursor-pointer"
                  >
                    افزودن و انتخاب 💾
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingAvatarOpen(false)}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
