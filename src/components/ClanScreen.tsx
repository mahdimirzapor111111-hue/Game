import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  ClanDef,
  ClanMember,
  ClanRole,
  ClanJoinType,
  ClanJoinRequest,
  getLeagueByTrophies,
} from '../types/game';
import {
  loadClans,
  createClan,
  joinClan,
  leaveClan,
  kickClanMember,
  promoteClanMember,
  updateClanDetails,
  sendClanMessage,
  getClanCooldownRemaining,
  loadAllUsers,
  approveClanJoinRequest,
  rejectClanJoinRequest,
} from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS, CLAN_BADGES_LIST } from '../assets/visuals';

interface ClanScreenProps {
  user: UserProfile;
  onUserUpdate: (u: UserProfile) => void;
  onChallengePlayer?: (targetUser: UserProfile) => void;
  onOpenDeck?: () => void;
}

export const ClanScreen: React.FC<ClanScreenProps> = ({
  user,
  onUserUpdate,
  onChallengePlayer,
}) => {
  const [clans, setClans] = useState<ClanDef[]>(() => loadClans());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJoinType, setFilterJoinType] = useState<'all' | 'open' | 'invite_only'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'chat' | 'members' | 'requests' | 'settings'>('chat');

  // Create clan modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [newClanDesc, setNewClanDesc] = useState('');
  const [newClanBadge, setNewClanBadge] = useState('👑');
  const [newClanCrestImage, setNewClanCrestImage] = useState<string>(CLAN_BADGES_LIST[0].url);
  const [newClanMinTrophies, setNewClanMinTrophies] = useState(300);
  const [newClanMinLevel, setNewClanMinLevel] = useState(1);
  const [newClanJoinType, setNewClanJoinType] = useState<ClanJoinType>('open');

  // Edit clan state (for Sultan)
  const [editClanName, setEditClanName] = useState('');
  const [editClanDesc, setEditClanDesc] = useState('');
  const [editClanBadge, setEditClanBadge] = useState('👑');
  const [editClanCrestImage, setEditClanCrestImage] = useState<string>('');
  const [editClanMinTrophies, setEditClanMinTrophies] = useState(0);
  const [editClanMinLevel, setEditClanMinLevel] = useState(1);
  const [editClanJoinType, setEditClanJoinType] = useState<ClanJoinType>('open');

  // Chat message state
  const [chatInput, setChatInput] = useState('');

  // Alerts & Notifications
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [memberToKick, setMemberToKick] = useState<ClanMember | null>(null);

  // Live timer for 24-hour clan cooldown
  const [cooldownRemaining, setCooldownRemaining] = useState(() => getClanCooldownRemaining(user));

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldownRemaining(getClanCooldownRemaining(user));
      setClans(loadClans());
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);

  const userClan = user.clanId ? clans.find((c) => c.id === user.clanId) : null;
  const isSultan = userClan?.sultanId === user.id || user.clanRole === 'sultan' || user.role === 'admin';
  const isElder = user.clanRole === 'elder' || isSultan;

  useEffect(() => {
    if (userClan) {
      setEditClanName(userClan.name);
      setEditClanDesc(userClan.description);
      setEditClanBadge(userClan.badge || '👑');
      setEditClanCrestImage(userClan.crestImage || CLAN_BADGES_LIST[0].url);
      setEditClanMinTrophies(userClan.requiredTrophies || 0);
      setEditClanMinLevel(userClan.requiredLevel || 1);
      setEditClanJoinType(userClan.joinType || (userClan.isClosed ? 'closed' : 'open'));
    }
  }, [userClan?.id]);

  // Image Upload helper for clan crest
  const handleUploadCrest = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
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
          if (isEditing) {
            setEditClanCrestImage(dataUri);
          } else {
            setNewClanCrestImage(dataUri);
          }
          sound.play('coin');
          setNotice('عکس پروفایل اختصاصی اتحادیه بارگذاری شد!');
          setTimeout(() => setNotice(null), 2500);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateClanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setNotice(null);

    const result = createClan(user, {
      name: newClanName,
      description: newClanDesc,
      badge: newClanBadge,
      crestImage: newClanCrestImage,
      requiredTrophies: newClanMinTrophies,
      requiredLevel: newClanMinLevel,
      joinType: newClanJoinType,
      isClosed: newClanJoinType === 'closed',
    });

    if (result.success && result.clan) {
      sound.play('victory');
      setClans(loadClans());
      setCreateModalOpen(false);
      const freshUser = {
        ...user,
        gold: user.gold - 300,
        clanId: result.clan.id,
        clanRole: 'sultan' as const,
      };
      onUserUpdate(freshUser);
      setNotice(`اتحادیه «${result.clan.name}» با موفقیت پایه‌گذاری شد! 👑`);
      setTimeout(() => setNotice(null), 3000);
    } else {
      sound.play('hit');
      setErrorNotice(result.error || 'خطا در ایجاد اتحادیه.');
    }
  };

  const handleJoinOrRequestClan = (clan: ClanDef) => {
    setErrorNotice(null);
    setNotice(null);

    const result = joinClan(user, clan.id);
    if (result.success) {
      sound.play('victory');
      setClans(loadClans());
      if (result.pendingApproval) {
        setNotice(`درخواست عضویت شما برای صاحب اتحادیه «${clan.name}» ارسال شد. به محض تأیید وارد خواهید شد! 📩`);
      } else {
        const freshUser = {
          ...user,
          clanId: clan.id,
          clanRole: 'member' as const,
        };
        onUserUpdate(freshUser);
        setNotice(`به اتحادیه «${clan.name}» خوش آمدید! 🛡️`);
      }
      setTimeout(() => setNotice(null), 3500);
    } else {
      sound.play('hit');
      setErrorNotice(result.error || 'امکان ورود به این اتحادیه وجود ندارد.');
    }
  };

  const handleConfirmLeave = () => {
    const result = leaveClan(user);
    if (result.success) {
      sound.play('select');
      setClans(loadClans());
      setLeaveModalOpen(false);
      const freshUser = {
        ...user,
        clanId: null,
        clanRole: null,
        lastClanLeaveTimestamp: Date.now(),
      };
      onUserUpdate(freshUser);
      setNotice('شما با موفقیت از اتحادیه خارج شدید. قانون مهلت ۲۴ ساعته فعال شد.');
      setTimeout(() => setNotice(null), 3500);
    } else {
      setErrorNotice(result.error || 'خطا در ترک اتحادیه.');
    }
  };

  const handleConfirmKick = () => {
    if (!userClan || !memberToKick) return;
    const result = kickClanMember(user, memberToKick.userId);
    if (result.success) {
      sound.play('death');
      setClans(loadClans());
      setNotice(`کاربر «${memberToKick.displayName}» از اتحادیه اخراج شد.`);
      setMemberToKick(null);
      setTimeout(() => setNotice(null), 3000);
    } else {
      setErrorNotice(result.error || 'خطا در اخراج عضو.');
    }
  };

  const handlePromoteMember = (member: ClanMember, newRole: ClanRole) => {
    if (!userClan) return;
    const result = promoteClanMember(user, member.userId, newRole);
    if (result.success) {
      sound.play('victory');
      setClans(loadClans());
      setNotice(`مقام ${member.displayName} به ${newRole === 'sultan' ? 'سلطان' : 'بزرگ‌تر'} تغییر یافت.`);
      setTimeout(() => setNotice(null), 3000);
    } else {
      setErrorNotice(result.error || 'خطا در تغییر مقام.');
    }
  };

  const handleApproveRequest = (request: ClanJoinRequest) => {
    if (!userClan) return;
    const result = approveClanJoinRequest(user, userClan.id, request.id);
    if (result.success) {
      sound.play('victory');
      setClans(loadClans());
      setNotice(`پهلوان «${request.displayName}» با تأیید شما به اتحادیه ملحق شد! 🛡️`);
      setTimeout(() => setNotice(null), 3000);
    } else {
      setErrorNotice(result.error || 'خطا در تایید درخواست.');
    }
  };

  const handleRejectRequest = (request: ClanJoinRequest) => {
    if (!userClan) return;
    const result = rejectClanJoinRequest(user, userClan.id, request.id);
    if (result.success) {
      sound.play('hit');
      setClans(loadClans());
      setNotice(`درخواست «${request.displayName}» رد شد.`);
      setTimeout(() => setNotice(null), 2500);
    } else {
      setErrorNotice(result.error || 'خطا در رد درخواست.');
    }
  };

  const handleSaveClanSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userClan) return;

    const result = updateClanDetails(user, {
      name: editClanName,
      description: editClanDesc,
      badge: editClanBadge,
      crestImage: editClanCrestImage,
      requiredTrophies: editClanMinTrophies,
      requiredLevel: editClanMinLevel,
      joinType: editClanJoinType,
      isClosed: editClanJoinType === 'closed',
    });

    if (result.success) {
      sound.play('coin');
      setClans(loadClans());
      setNotice('تنظیمات و محدودیت‌های ورود اتحادیه با موفقیت ذخیره شد.');
      setTimeout(() => setNotice(null), 3000);
    } else {
      setErrorNotice(result.error || 'خطا در ذخیره تنظیمات.');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const ok = sendClanMessage(user, chatInput);
    if (ok) {
      sound.play('select');
      setChatInput('');
      setClans(loadClans());
    }
  };

  const handleSendDuelChallenge = () => {
    const ok = sendClanMessage(user, `آماده دوئل و تمرین هستم! چه کسی به مبارزه می‌آید؟`, 'duel_request');
    if (ok) {
      sound.play('attack');
      setClans(loadClans());
      setNotice('درخواست دوئل در چت اتحادیه ارسال شد!');
      setTimeout(() => setNotice(null), 2500);
    }
  };

  const filteredClans = clans.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sultanName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterJoinType === 'open') return c.joinType === 'open' || (!c.joinType && !c.isClosed);
    if (filterJoinType === 'invite_only') return c.joinType === 'invite_only';
    return true;
  });

  const pendingRequestsCount = userClan?.joinRequests?.length || 0;

  return (
    <div className="w-full flex-1 flex flex-col items-center p-3 sm:p-5 overflow-y-auto select-none bg-stone-950 text-stone-100 pb-24">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* ================= CLAN ARTWORK HERO BANNER ================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-purple-500/60 shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src={userClan?.bannerImage || GAME_VISUALS.clanBannerHall}
            alt="Clan Hall"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/90 via-stone-950/80 to-purple-950/90 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4 text-center md:text-right">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl shrink-0 bg-stone-900 ring-4 ring-purple-500/30">
              <img
                src={userClan?.crestImage || GAME_VISUALS.clanLionCrest}
                alt="Clan Crest"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-lg sm:text-2xl font-black text-amber-200 drop-shadow">
                  {userClan ? userClan.name : 'اتحادیه و قبایل پهلوانان شاهنامه'}
                </h2>
                <span className="bg-purple-600/90 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow border border-purple-400 flex items-center gap-1">
                  <img src={GAME_VISUALS.crownRankIcon} alt="Crown" className="w-3.5 h-3.5 rounded-full" />
                  <span>{userClan ? `سطح ${userClan.level}` : 'همبستگی پهلوانی'}</span>
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed drop-shadow">
                {userClan
                  ? userClan.description
                  : 'پایه‌گذاری یا پیوستن به قبیله‌های اساطیری، چت زنده، تبادل تجربه، مسابقات درون‌کلنی و ورود با تأیید صاحب کلن'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
            {!userClan ? (
              <button
                onClick={() => {
                  sound.play('click');
                  setCreateModalOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-400 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-xl transition transform active:scale-95 flex items-center gap-2 cursor-pointer border border-purple-300"
              >
                <img src={GAME_VISUALS.clanShieldIcon} alt="Badge" className="w-6 h-6 rounded-full object-cover shadow" />
                <span>تأسیس اتحادیه</span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/50 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                  <img src={GAME_VISUALS.coinIcon} alt="Coin" className="w-3.5 h-3.5 rounded-full" />
                  <span>۳۰۰ سکه</span>
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2.5 bg-stone-950/90 border border-purple-500/60 px-4 py-2.5 rounded-2xl shadow-lg backdrop-blur">
                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-400 shrink-0">
                    <img src={userClan.crestImage || GAME_VISUALS.clanLionCrest} alt="Crest" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-purple-200">{userClan.name}</div>
                    <span className="text-[10px] text-amber-300 flex items-center gap-1">
                      <img src={GAME_VISUALS.crownRankIcon} alt="Rank" className="w-3 h-3 rounded-full" />
                      <span>مقام: {user.clanRole === 'sultan' ? 'سلطان' : user.clanRole === 'elder' ? 'بزرگ‌تر' : 'عضو'}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setLeaveModalOpen(true)}
                  className="bg-rose-950/90 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs px-3.5 py-2.5 rounded-2xl font-bold transition shadow cursor-pointer flex items-center gap-1"
                  title="ترک اتحادیه"
                >
                  <span>ترک قبیله</span>
                  <span>🚪</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 24-HOUR COOLDOWN WARNING BANNER */}
        {!cooldownRemaining.canJoin && (
          <div className="bg-rose-950/90 border-2 border-rose-600 text-rose-100 rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-in fade-in">
            <span className="text-3xl animate-pulse">⏳</span>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-black text-sm text-rose-300">
                مهلت خروج از اتحادیه قبلی فعال است
              </h4>
              <p className="text-rose-200 leading-relaxed">
                طبق قوانین شاهنامه، پس از خروج از هر اتحادیه باید ۲۴ ساعت صبوری کنید تا بتوانید به اتحادیه جدیدی ملحق شوید.
              </p>
              <div className="text-amber-300 font-black pt-1">
                زمان باقی‌مانده: <b>{cooldownRemaining.formatted}</b>
              </div>
            </div>
          </div>
        )}

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

        {/* ================= SECTION A: USER IS IN A CLAN ================= */}
        {userClan ? (
          <div className="flex flex-col gap-4">
            {/* Clan Dashboard Banner */}
            <div className="bg-stone-900/90 border border-purple-500/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-right">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden bg-purple-950/80 border-2 border-purple-400 shadow-xl shadow-purple-900/40 shrink-0">
                  <img
                    src={userClan.crestImage || GAME_VISUALS.clanLionCrest}
                    alt="Clan Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-purple-200">
                      {userClan.name}
                    </h3>
                    <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/50 font-bold">
                      سطح {userClan.level}
                    </span>

                    {/* Join Type Badge */}
                    {userClan.joinType === 'invite_only' ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold flex items-center gap-1">
                        <span>📩 ورود با تأیید صاحب کلن</span>
                      </span>
                    ) : userClan.joinType === 'closed' || userClan.isClosed ? (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40 font-bold flex items-center gap-1">
                        <span>🔒 اتحادیه بسته</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold flex items-center gap-1">
                        <span>🔓 آزاد برای ورود</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-300 max-w-md">
                    {userClan.description}
                  </p>
                  <div className="text-[11px] text-stone-400 flex items-center justify-center sm:justify-start gap-2 pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <img src={GAME_VISUALS.crownRankIcon} alt="Sultan" className="w-3.5 h-3.5 rounded-full" />
                      <span>صاحب کلن: <b className="text-amber-300">{userClan.sultanName}</b></span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophies" className="w-3.5 h-3.5 rounded-full" />
                      <span>حداقل کاپ: <b>{userClan.requiredTrophies}</b></span>
                    </span>
                    <span>•</span>
                    <span>حداقل سطح: <b>{userClan.requiredLevel || 1}</b></span>
                  </div>
                </div>
              </div>

              {/* Clan Stats */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs w-full sm:w-auto">
                <div className="bg-stone-950/90 border border-purple-500/30 px-4 py-3 rounded-2xl shadow-inner flex flex-col items-center">
                  <span className="text-stone-400 text-[10px] block">مجموع کاپ</span>
                  <div className="flex items-center gap-1 font-black text-amber-300 text-sm sm:text-base mt-0.5">
                    <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-4 h-4 rounded-full" />
                    <span>{userClan.totalTrophies}</span>
                  </div>
                </div>
                <div className="bg-stone-950/90 border border-purple-500/30 px-4 py-3 rounded-2xl shadow-inner flex flex-col items-center">
                  <span className="text-stone-400 text-[10px] block">اعضای قبیله</span>
                  <div className="flex items-center gap-1 font-black text-purple-300 text-sm sm:text-base mt-0.5">
                    <img src={GAME_VISUALS.clanShieldIcon} alt="Members" className="w-4 h-4 rounded-full" />
                    <span>{userClan.members.length} / 50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex bg-stone-900 p-1.5 rounded-2xl border border-stone-800 gap-1.5 overflow-x-auto">
              {[
                { id: 'chat' as const, label: 'تالار گفتگو و دوئل', iconImg: GAME_VISUALS.chatScrollIcon },
                { id: 'members' as const, label: `اعضای قبیله (${userClan.members.length})`, iconImg: GAME_VISUALS.clanShieldIcon },
                ...(isElder
                  ? [
                      {
                        id: 'requests' as const,
                        label: `درخواست‌های ورود (${pendingRequestsCount})`,
                        iconImg: GAME_VISUALS.crownRankIcon,
                        badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
                      },
                    ]
                  : []),
                { id: 'info' as const, label: 'قوانین و افتخارات', iconImg: GAME_VISUALS.trophyEventsIcon },
                ...(isSultan
                  ? [{ id: 'settings' as const, label: 'مدیریت و عکس کلن', iconImg: GAME_VISUALS.forgeEditorIcon }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.play('click');
                    setActiveSubTab(tab.id);
                  }}
                  className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer relative ${
                    activeSubTab === tab.id
                      ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/30 border border-purple-400'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <img src={tab.iconImg} alt="Icon" className="w-4 h-4 rounded-full object-cover shadow" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sub-Tab 1: Clan Chat */}
            {activeSubTab === 'chat' && (
              <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <img src={GAME_VISUALS.chatScrollIcon} alt="Chat" className="w-4 h-4 rounded-full" />
                    <span>پیام‌های اعضای اتحادیه</span>
                  </span>
                  <button
                    onClick={handleSendDuelChallenge}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer border border-amber-300"
                  >
                    <img src={GAME_VISUALS.duelSwordsIcon} alt="Swords" className="w-5 h-5 rounded-full object-cover shadow" />
                    <span>درخواست دوئل دوستانه ⚔️</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1 min-h-[160px]">
                  {userClan.messages.length === 0 ? (
                    <div className="text-center text-xs text-stone-500 py-8">
                      هنوز پیامی در اتحادیه ثبت نشده است. اولین پیام را شما ارسال کنید!
                    </div>
                  ) : (
                    userClan.messages.map((msg) => {
                      const isMe = msg.senderId === user.id;
                      const isSystem = msg.type === 'system';
                      const isDuel = msg.type === 'duel_request';

                      if (isSystem) {
                        return (
                          <div
                            key={msg.id}
                            className="bg-purple-950/40 border border-purple-500/30 rounded-xl py-1.5 px-3 text-[11px] text-purple-200 text-center mx-auto max-w-md shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <span>📢</span>
                            <span>{msg.text}</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 p-3 rounded-2xl border transition ${
                            isDuel
                              ? 'bg-amber-950/40 border-amber-500/60 shadow-md'
                              : isMe
                              ? 'bg-purple-950/30 border-purple-500/40 mr-auto max-w-[85%]'
                              : 'bg-stone-950/80 border-stone-800 ml-auto max-w-[85%]'
                          }`}
                        >
                          <UserAvatar avatar={msg.senderAvatar} size="sm" />
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-amber-200">
                                {msg.senderName}
                              </span>
                              {msg.senderRole === 'sultan' && (
                                <span className="text-[9px] bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                  <img src={GAME_VISUALS.crownRankIcon} alt="Crown" className="w-2.5 h-2.5 rounded-full" />
                                  <span>سلطان</span>
                                </span>
                              )}
                              {msg.senderRole === 'elder' && (
                                <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">
                                  بزرگ‌تر
                                </span>
                              )}
                              <span className="text-[9px] text-stone-500 mr-auto">
                                {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-stone-200 leading-relaxed">
                              {msg.text}
                            </p>
                            {isDuel && !isMe && onChallengePlayer && (
                              <div className="pt-2">
                                <button
                                  onClick={() => {
                                    const allUsers = loadAllUsers();
                                    const target = allUsers.find((u) => u.id === msg.senderId);
                                    if (target) {
                                      sound.play('click');
                                      onChallengePlayer(target);
                                    }
                                  }}
                                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300"
                                >
                                  <img src={GAME_VISUALS.duelSwordsIcon} alt="Duel" className="w-4 h-4 rounded-full" />
                                  <span>پذیرش مبارزه</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-stone-800">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="پیامی برای هم‌رزمان بنویسید..."
                    className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <img src={GAME_VISUALS.chatScrollIcon} alt="Send" className="w-4 h-4 rounded-full object-cover" />
                    <span>ارسال پیام</span>
                  </button>
                </form>
              </div>
            )}

            {/* Sub-Tab 2: Members List & Kick Controls */}
            {activeSubTab === 'members' && (
              <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <img src={GAME_VISUALS.trophyEventsIcon} alt="Rank" className="w-4 h-4 rounded-full" />
                    <span>رده‌بندی اعضای اتحادیه ({userClan.members.length} نفر)</span>
                  </span>
                  {isElder && (
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <img src={GAME_VISUALS.crownRankIcon} alt="Crown" className="w-3 h-3 rounded-full" />
                      <span>اختیارات اخراج و مدیریت فعال است</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {[...userClan.members]
                    .sort((a, b) => (b.trophies || 0) - (a.trophies || 0))
                    .map((member, idx) => {
                      const isMemberMe = member.userId === user.id;
                      const memberLeague = getLeagueByTrophies(member.trophies || 0);

                      // Can current user kick this member?
                      const canKick =
                        !isMemberMe &&
                        (isSultan || (user.clanRole === 'elder' && member.role === 'member'));

                      return (
                        <div
                          key={member.userId}
                          className="bg-stone-950 border border-stone-800 hover:border-purple-500/50 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow transition"
                        >
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="font-black text-xs w-6 text-center text-amber-400">
                              #{idx + 1}
                            </span>
                            <UserAvatar avatar={member.avatar} size="md" />
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-xs sm:text-sm text-stone-200">
                                  {member.displayName}
                                </span>
                                {member.role === 'sultan' && (
                                  <span className="bg-amber-500 text-stone-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
                                    <img src={GAME_VISUALS.crownRankIcon} alt="Sultan" className="w-2.5 h-2.5 rounded-full" />
                                    <span>صاحب کلن</span>
                                  </span>
                                )}
                                {member.role === 'elder' && (
                                  <span className="bg-purple-700 text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                                    بزرگ‌تر
                                  </span>
                                )}
                                {isMemberMe && (
                                  <span className="bg-stone-800 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                    شما
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                                <span>{memberLeague.icon} {memberLeague.name}</span>
                                <span>•</span>
                                <span>سطح {member.level}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-800/80">
                            <div className="flex items-center gap-1.5 font-black text-amber-300 text-xs sm:text-sm bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                              <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-4 h-4 rounded-full" />
                              <span>{member.trophies}</span>
                            </div>

                            {/* SULTAN & ELDER MANAGEMENT CONTROLS */}
                            {!isMemberMe && (
                              <div className="flex items-center gap-1.5">
                                {isSultan && member.role !== 'elder' && (
                                  <button
                                    onClick={() => handlePromoteMember(member, 'elder')}
                                    className="bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                                    title="ارتقا به بزرگ‌تر"
                                  >
                                    + بزرگ‌تر
                                  </button>
                                )}
                                {isSultan && member.role === 'elder' && (
                                  <button
                                    onClick={() => handlePromoteMember(member, 'member')}
                                    className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                                    title="تنزل به عضو عادی"
                                  >
                                    عضو عادی
                                  </button>
                                )}
                                {canKick && (
                                  <button
                                    onClick={() => setMemberToKick(member)}
                                    className="bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 hover:text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition cursor-pointer shadow flex items-center gap-1"
                                    title="اخراج این عضو از اتحادیه"
                                  >
                                    <span>اخراج</span>
                                    <span>🚫</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Join Requests (Approval Required Flow) */}
            {activeSubTab === 'requests' && isElder && (
              <div className="bg-stone-900/90 border border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📩</span>
                    <div>
                      <h4 className="font-black text-sm text-amber-200">
                        درخواست‌های ورود به اتحادیه
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        تنها با تأیید شما، پهلوانان به عضویت این قبیله درمی‌آیند.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-500 text-stone-950 px-2.5 py-1 rounded-full font-black">
                    {pendingRequestsCount} درخواست در انتظار
                  </span>
                </div>

                {(!userClan.joinRequests || userClan.joinRequests.length === 0) ? (
                  <div className="text-center text-xs text-stone-500 py-10 space-y-2">
                    <span className="text-3xl block">📭</span>
                    <span>در حال حاضر هیچ درخواست ورودی در انتظار تایید وجود ندارد.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {userClan.joinRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-stone-950 border border-amber-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar avatar={req.avatar} size="md" />
                          <div className="text-right">
                            <div className="font-black text-xs sm:text-sm text-stone-100">
                              {req.displayName}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                              <span>کاپ: <b className="text-amber-300">{req.trophies} 🏆</b></span>
                              <span>•</span>
                              <span>سطح: <b>{req.level}</b></span>
                              <span>•</span>
                              <span className="text-stone-500">
                                {new Date(req.requestedAt).toLocaleTimeString('fa-IR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>تأیید و ورود</span>
                            <span>✅</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req)}
                            className="flex-1 sm:flex-none bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-stone-700 transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>رد</span>
                            <span>❌</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 4: Clan Rules & Honors */}
            {activeSubTab === 'info' && (
              <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="border-b border-stone-800 pb-3">
                  <h4 className="font-black text-sm text-purple-200 flex items-center gap-2">
                    <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-5 h-5 rounded-full" />
                    <span>آیین‌نامه، مشخصات و قوانین قبیله</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                    <span className="font-bold text-amber-300 block">نحوه پذیرش اعضا</span>
                    <p className="text-stone-400 leading-relaxed text-[11px]">
                      {userClan.joinType === 'invite_only'
                        ? 'این اتحادیه خصوصی است و اعضا تنها با تایید مستقیم صاحب کلن یا بزرگان وارد می‌شوند.'
                        : userClan.joinType === 'closed' || userClan.isClosed
                        ? 'این اتحادیه در حال حاضر بسته است و پذیرش جدیدی ندارد.'
                        : 'این اتحادیه برای همه پهلوانانی که شرط حداقل کاپ و سطح را دارند آزاد است.'}
                    </p>
                  </div>
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                    <span className="font-bold text-purple-300 block">قانون مهلت ۲۴ ساعته</span>
                    <p className="text-stone-400 leading-relaxed text-[11px]">
                      جهت حفظ پایداری قبیله‌ها، پس از خروج از هر اتحادیه، کاربر تا ۲۴ ساعت قادر به عضویت در اتحادیه جدید نخواهد بود.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 5: Sultan Settings & Clan Profile Picture Customizer */}
            {activeSubTab === 'settings' && isSultan && (
              <div className="bg-stone-900/90 border border-purple-500/40 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={GAME_VISUALS.crownRankIcon} alt="Crown" className="w-5 h-5 rounded-full" />
                    <h4 className="font-black text-sm text-amber-300">
                      مدیریت کامل، عکس پروفایل و محدودیت‌های ورود اتحادیه
                    </h4>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    پنل اختصاصی سلطان
                  </span>
                </div>

                <form onSubmit={handleSaveClanSettings} className="flex flex-col gap-4 text-xs">
                  {/* Name and Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-300 font-bold mb-1">
                        نام اتحادیه:
                      </label>
                      <input
                        type="text"
                        value={editClanName}
                        onChange={(e) => setEditClanName(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-stone-100 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 font-bold mb-1">
                        شعار و توضیحات قبیله:
                      </label>
                      <input
                        type="text"
                        value={editClanDesc}
                        onChange={(e) => setEditClanDesc(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-stone-100 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* ================= CLAN PROFILE PICTURE SELECTION ================= */}
                  <div className="bg-stone-950/80 p-4 rounded-2xl border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-amber-300 font-black block">
                        عکس و نشان پروفایل اتحادیه:
                      </label>
                      <span className="text-[10px] text-stone-400">
                        انتخاب از نشان‌های اساطیری یا آپلود عکس دلخواه
                      </span>
                    </div>

                    {/* Live Preview */}
                    <div className="flex items-center gap-3 bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg shrink-0 bg-stone-950">
                        <img
                          src={editClanCrestImage || GAME_VISUALS.clanLionCrest}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-stone-200">پیش‌نمایش آیکون فعلی قبیله</div>
                        <div className="flex items-center gap-2">
                          <label className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl cursor-pointer shadow transition inline-flex items-center gap-1">
                            <span>📁 آپلود عکس از دستگاه</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadCrest(e, true)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Preset Badges Grid */}
                    <div>
                      <span className="text-[11px] text-stone-400 font-bold block mb-1.5">
                        انتخاب نشان‌های رسمی ۳ بعدی شاهنامه:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {CLAN_BADGES_LIST.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              sound.play('click');
                              setEditClanCrestImage(b.url);
                              setEditClanBadge(b.emoji);
                            }}
                            className={`p-1 rounded-2xl border transition duration-200 cursor-pointer flex flex-col items-center gap-1 ${
                              editClanCrestImage === b.url
                                ? 'bg-purple-600/30 border-amber-400 scale-105 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                                : 'bg-stone-900 border-stone-800 hover:border-purple-500/50'
                            }`}
                          >
                            <img src={b.url} alt={b.name} className="w-10 h-10 rounded-xl object-cover" />
                            <span className="text-[9px] text-stone-300 truncate max-w-full text-center">
                              {b.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ================= ENTRY RESTRICTIONS ================= */}
                  <div className="bg-stone-950/80 p-4 rounded-2xl border border-purple-500/30 space-y-3">
                    <label className="text-amber-300 font-black block">
                      محدودیت‌ها و شرایط پذیرش اعضا:
                    </label>

                    {/* Join Type (Open vs Invite-Only vs Closed) */}
                    <div>
                      <span className="text-stone-300 font-bold block mb-1.5">
                        نوع پذیرش و ورود به اتحادیه:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditClanJoinType('open')}
                          className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col gap-1 ${
                            editClanJoinType === 'open'
                              ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 shadow'
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <div className="font-black text-xs flex items-center gap-1">
                            <span>🔓 آزاد برای همه</span>
                          </div>
                          <span className="text-[10px] leading-relaxed">
                            هر پهلوانی با شرایط لازم می‌تواند فوراً ملحق شود.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditClanJoinType('invite_only')}
                          className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col gap-1 ${
                            editClanJoinType === 'invite_only'
                              ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow'
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <div className="font-black text-xs flex items-center gap-1">
                            <span>📩 فقط با تأیید صاحب کلن</span>
                          </div>
                          <span className="text-[10px] leading-relaxed">
                            ورود اعضا منوط به ارسال درخواست و تأیید سلطان یا بزرگان است.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditClanJoinType('closed')}
                          className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col gap-1 ${
                            editClanJoinType === 'closed'
                              ? 'bg-rose-950/60 border-rose-400 text-rose-200 shadow'
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <div className="font-black text-xs flex items-center gap-1">
                            <span>🔒 بسته (مسدود)</span>
                          </div>
                          <span className="text-[10px] leading-relaxed">
                            عضو جدیدی پذیرفته نمی‌شود.
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Minimum Trophies & Level Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-800">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-stone-300 font-bold">
                            حداقل کاپ رنکد ورودی:
                          </label>
                          <b className="text-amber-400 font-black">{editClanMinTrophies} 🏆</b>
                        </div>
                        <input
                          type="number"
                          value={editClanMinTrophies}
                          onChange={(e) => setEditClanMinTrophies(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-stone-100 focus:border-purple-400 focus:outline-none"
                        />
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {[0, 300, 600, 1000, 1500, 2000].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setEditClanMinTrophies(t)}
                              className="text-[10px] bg-stone-900 hover:bg-stone-800 px-2 py-0.5 rounded border border-stone-700 text-stone-300"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-stone-300 font-bold">
                            حداقل سطح بازیکن (لول):
                          </label>
                          <b className="text-purple-300 font-black">سطح {editClanMinLevel}</b>
                        </div>
                        <input
                          type="number"
                          value={editClanMinLevel}
                          onChange={(e) => setEditClanMinLevel(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-stone-100 focus:border-purple-400 focus:outline-none"
                        />
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {[1, 3, 5, 8, 10].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setEditClanMinLevel(lvl)}
                              className="text-[10px] bg-stone-900 hover:bg-stone-800 px-2 py-0.5 rounded border border-stone-700 text-stone-300"
                            >
                              سطح {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black px-6 py-3 rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2 border border-purple-300"
                    >
                      <img src={GAME_VISUALS.clanShieldIcon} alt="Save" className="w-5 h-5 rounded-full" />
                      <span>ذخیره کلیه تنظیمات و محدودیت‌ها</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* ================= SECTION B: USER IS NOT IN A CLAN ================= */
          <div className="flex flex-col gap-4">
            {/* Search & Filter Header bar */}
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام قبیله یا نام صاحب کلن..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-3 pr-9 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-purple-400"
                />
                <span className="absolute right-3 top-2.5 text-stone-500 text-xs">🔍</span>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setFilterJoinType('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    filterJoinType === 'all'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  همه ({clans.length})
                </button>
                <button
                  onClick={() => setFilterJoinType('open')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                    filterJoinType === 'open'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  <span>ورود آزاد</span>
                </button>
                <button
                  onClick={() => setFilterJoinType('invite_only')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                    filterJoinType === 'invite_only'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  <span>با تأیید رهبر</span>
                </button>
              </div>
            </div>

            {/* Clan List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredClans.length === 0 ? (
                <div className="col-span-full bg-stone-900/60 border border-stone-800 rounded-3xl p-8 text-center text-stone-500 text-xs">
                  هیچ اتحادیه‌ای با این مشخصات یافت نشد. اولین اتحادیه را شما بسازید!
                </div>
              ) : (
                filteredClans.map((c) => {
                  const isFull = c.members.length >= 50;
                  const canJoinTrophies = (user.trophies || 150) >= c.requiredTrophies;
                  const canJoinLevel = user.level >= (c.requiredLevel || 1);
                  const isClosed = c.isClosed || c.joinType === 'closed';
                  const isInviteOnly = c.joinType === 'invite_only';
                  const hasPendingRequest = c.joinRequests?.some((r) => r.userId === user.id);

                  const canAct = cooldownRemaining.canJoin && !isFull && canJoinTrophies && canJoinLevel && !isClosed;

                  return (
                    <div
                      key={c.id}
                      className="bg-stone-900/90 border border-stone-800 hover:border-purple-500/50 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xl transition"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-purple-950 border-2 border-purple-400/60 flex items-center justify-center shrink-0 shadow-lg">
                          <img
                            src={c.crestImage || GAME_VISUALS.clanLionCrest}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-sm sm:text-base text-purple-200">
                              {c.name}
                            </h4>
                            <span className="text-[10px] bg-purple-900/70 text-purple-200 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                              سطح {c.level}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                            {c.description}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <img src={GAME_VISUALS.crownRankIcon} alt="Sultan" className="w-3 h-3 rounded-full" />
                              <span>صاحب کلن: <b className="text-amber-300">{c.sultanName}</b></span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <img src={GAME_VISUALS.clanShieldIcon} alt="Members" className="w-3 h-3 rounded-full" />
                              <span>{c.members.length}/۵۰</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-stone-800 pt-3 text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 text-[11px] flex items-center gap-1">
                            <img src={GAME_VISUALS.trophyEventsIcon} alt="Trophy" className="w-3.5 h-3.5 rounded-full" />
                            <span>کاپ: <b>{c.totalTrophies}</b></span>
                          </span>
                          <span className="text-stone-600">|</span>
                          <span className="text-stone-400 text-[11px]">
                            شرط: <b>{c.requiredTrophies} 🏆</b> / <b>سطح {c.requiredLevel || 1}</b>
                          </span>
                        </div>

                        {/* Action Join or Request Button */}
                        <button
                          onClick={() => handleJoinOrRequestClan(c)}
                          disabled={!canAct || hasPendingRequest}
                          className={`font-black text-xs px-4 py-2 rounded-xl transition shadow active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                            hasPendingRequest
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 cursor-default'
                              : canAct
                              ? isInviteOnly
                                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-stone-950 border border-amber-300 shadow-amber-600/30 font-black'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white border border-purple-400 shadow-purple-600/30'
                              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                          }`}
                        >
                          <img src={GAME_VISUALS.clanShieldIcon} alt="Join" className="w-3.5 h-3.5 rounded-full" />
                          <span>
                            {hasPendingRequest
                              ? 'درخواست ارسال شده ⏳'
                              : isFull
                              ? 'تکمیل ظرفیت'
                              : !canJoinTrophies
                              ? `کاپ ناکافی (${c.requiredTrophies})`
                              : !canJoinLevel
                              ? `سطح ناکافی (${c.requiredLevel})`
                              : isClosed
                              ? 'بسته'
                              : !cooldownRemaining.canJoin
                              ? 'مهلت ۲۴ ساعت'
                              : isInviteOnly
                              ? 'درخواست ورود به کلن 📩'
                              : 'ورود به اتحادیه'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= MODAL 1: CREATE CLAN ================= */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-stone-900 border-2 border-purple-500/60 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto text-right">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="font-black text-lg text-purple-200 flex items-center gap-2">
                  <img src={GAME_VISUALS.clanShieldIcon} alt="Shield" className="w-6 h-6 rounded-full" />
                  <span>پایه‌گذاری اتحادیه شاهنامه</span>
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-stone-400 hover:text-white text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateClanSubmit} className="flex flex-col gap-3.5 text-xs">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    نام اتحادیه:
                  </label>
                  <input
                    type="text"
                    required
                    value={newClanName}
                    onChange={(e) => setNewClanName(e.target.value)}
                    placeholder="مثال: دلاوران البرز"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-stone-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    شعار و مرام‌نامه قبیله:
                  </label>
                  <textarea
                    value={newClanDesc}
                    onChange={(e) => setNewClanDesc(e.target.value)}
                    placeholder="شعار جنگی و اهداف اتحادیه..."
                    rows={2}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-stone-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Profile Picture & Crest Selector */}
                <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-amber-300 font-bold block">
                      عکس پروفایل و نشان اختصاصی اتحادیه:
                    </label>
                    <label className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer">
                      <span>📁 آپلود عکس</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadCrest(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-3 bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 bg-stone-950">
                      <img src={newClanCrestImage} alt="Selected" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[11px] text-stone-300">
                      نشان انتخاب شده برای پروفایل، بنر و تالار این قبیله
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {CLAN_BADGES_LIST.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setNewClanCrestImage(b.url);
                          setNewClanBadge(b.emoji);
                        }}
                        className={`p-1 rounded-xl border transition cursor-pointer flex flex-col items-center gap-0.5 ${
                          newClanCrestImage === b.url
                            ? 'bg-purple-600/40 border-amber-400 scale-105 shadow'
                            : 'bg-stone-900 border-stone-800'
                        }`}
                      >
                        <img src={b.url} alt={b.name} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-[8px] text-stone-300 truncate max-w-full">
                          {b.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entry Restrictions in Create Clan */}
                <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 space-y-2.5">
                  <label className="text-amber-300 font-bold block">
                    محدودیت‌های ورود اعضا:
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewClanJoinType('open')}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer ${
                        newClanJoinType === 'open'
                          ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      <div className="font-bold text-[11px]">🔓 ورود آزاد</div>
                      <span className="text-[9px] text-stone-400">بدون نیاز به تأیید</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewClanJoinType('invite_only')}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer ${
                        newClanJoinType === 'invite_only'
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      <div className="font-bold text-[11px]">📩 با تأیید صاحب کلن</div>
                      <span className="text-[9px] text-stone-400">ورود با درخواست</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-stone-300 font-bold text-[11px] mb-1">
                        حداقل کاپ ورودی:
                      </label>
                      <input
                        type="number"
                        value={newClanMinTrophies}
                        onChange={(e) => setNewClanMinTrophies(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2 text-stone-100 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 font-bold text-[11px] mb-1">
                        حداقل سطح (لول):
                      </label>
                      <input
                        type="number"
                        value={newClanMinLevel}
                        onChange={(e) => setNewClanMinLevel(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2 text-stone-100 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-300 font-black">
                    <img src={GAME_VISUALS.coinIcon} alt="Cost" className="w-5 h-5 rounded-full" />
                    <span>هزینه تأسیس: ۳۰۰ سکه طلا</span>
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black px-6 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <img src={GAME_VISUALS.clanShieldIcon} alt="Build" className="w-4 h-4 rounded-full" />
                    <span>تأسیس قبیله</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: CONFIRM LEAVE CLAN ================= */}
        {leaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-right">
              <div className="text-center space-y-2">
                <span className="text-4xl">⚠️</span>
                <h3 className="font-black text-lg text-rose-300">
                  آیا از ترک اتحادیه اطمینان دارید؟
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  طبق قوانین، پس از خروج از این اتحادیه تا <b className="text-amber-300">۲۴ ساعت</b> امکان عضویت یا ساخت اتحادیه دیگری را نخواهید داشت.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setLeaveModalOpen(false)}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs py-2.5 rounded-xl border border-stone-700 cursor-pointer"
                >
                  انصراف و ماندن
                </button>
                <button
                  onClick={handleConfirmLeave}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  تایید و خروج 🚪
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: CONFIRM KICK MEMBER ================= */}
        {memberToKick && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-right">
              <div className="text-center space-y-2">
                <span className="text-4xl">🚫</span>
                <h3 className="font-black text-lg text-rose-300">
                  اخراج عضو از قبیله
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  آیا از اخراج پهلوان <b className="text-amber-300">{memberToKick.displayName}</b> از اتحادیه اطمینان دارید؟
                  پس از اخراج، پیامی در چت قبیله ثبت شده و وی از اعضا حذف خواهد شد.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setMemberToKick(null)}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs py-2.5 rounded-xl border border-stone-700 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmKick}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  اخراج قطعی 🚫
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
