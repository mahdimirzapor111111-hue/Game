import React, { useState } from 'react';
import {
  GameEvent,
  EventReward,
  EventPeriod,
  EventGoalType,
  CardDef,
} from '../types/game';
import {
  loadEvents,
  createOrUpdateEvent,
  deleteEvent,
  manuallySettleEvent,
} from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface EventEditorScreenProps {
  cardLibrary: CardDef[];
  onEventUpdated?: () => void;
}

const PRESET_ICONS = ['🏆', '⚔️', '👑', '⚡', '💎', '🔥', '🛡️', '🌟', '🏹', '🐺', '🐉', '🦅'];

export const EventEditorScreen: React.FC<EventEditorScreenProps> = ({
  cardLibrary,
  onEventUpdated,
}) => {
  const [events, setEvents] = useState<GameEvent[]>(() => loadEvents());
  const [editingEvent, setEditingEvent] = useState<GameEvent | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRewardTierIdx] = useState<number | null>(null);

  const refreshEvents = () => {
    const fresh = loadEvents();
    setEvents(fresh);
    if (onEventUpdated) onEventUpdated();
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleStartCreate = (period: EventPeriod = 'weekly', goal: EventGoalType = 'most_wins') => {
    sound.play('click');
    const now = Date.now();
    const durationMs = period === 'weekly' ? 7 * 86400000 : 30 * 86400000;

    const newEv: GameEvent = {
      id: 'event_' + period + '_' + goal + '_' + Date.now(),
      title:
        period === 'weekly'
          ? goal === 'most_wins'
            ? 'جام هفتگی پهلوانان ایران'
            : 'مسابقه هفتگی ارتقای ارتش'
          : goal === 'most_wins'
          ? 'ماراتن ماهانه دلاوران شاهنامه'
          : 'لیگ ماهانه پرورش قهرمانان',
      description:
        goal === 'most_wins'
          ? 'در نبردهای رنکد پیروز شوید تا بیشترین برد را کسب کرده و جوایز افسانه‌ای بگیرید!'
          : 'کارت‌های ارتش خود را با نبرد و پیروزی ارتقا دهید تا برنده جوایز بزرگ ماهانه شوید!',
      period,
      goalType: goal,
      icon: goal === 'most_wins' ? '🏆' : '⚡',
      startDate: now,
      endDate: now + durationMs,
      isActive: true,
      claimedUserIds: [],
      rewards: [
        {
          rankFrom: 1,
          rankTo: 1,
          gold: period === 'weekly' ? 5000 : 15000,
          gems: period === 'weekly' ? 200 : 600,
          cardIds: [cardLibrary[0]?.id || 'hero_rostam'],
          titleBadge: period === 'weekly' ? '👑 قهرمان هفتگی' : '🌟 اسطوره ماه',
        },
        {
          rankFrom: 2,
          rankTo: 3,
          gold: period === 'weekly' ? 2500 : 7500,
          gems: period === 'weekly' ? 100 : 300,
          cardIds: [cardLibrary[1]?.id || 'hero_arash'],
          titleBadge: '🥈 پهلوان نقره‌ای',
        },
        {
          rankFrom: 4,
          rankTo: 10,
          gold: period === 'weekly' ? 1000 : 3000,
          gems: period === 'weekly' ? 40 : 120,
        },
      ],
    };
    setEditingEvent(newEv);
    setIsCreatingNew(true);
  };

  const handleEdit = (ev: GameEvent) => {
    sound.play('click');
    setEditingEvent(JSON.parse(JSON.stringify(ev)));
    setIsCreatingNew(false);
  };

  const handleToggleActive = (ev: GameEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.play('select');
    const updated = { ...ev, isActive: !ev.isActive };
    createOrUpdateEvent(updated);
    refreshEvents();
    showNotice(
      updated.isActive
        ? `رویداد "${ev.title}" فعال شد.`
        : `رویداد "${ev.title}" غیرفعال شد.`
    );
  };

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`آیا از حذف رویداد "${title}" اطمینان دارید؟`)) return;
    deleteEvent(id);
    sound.play('death');
    refreshEvents();
    if (editingEvent?.id === id) {
      setEditingEvent(null);
    }
    showNotice(`رویداد "${title}" با موفقیت حذف شد.`);
  };

  const [settleConfirmId, setSettleConfirmId] = useState<string | null>(null);

  const handleSettleNow = (ev: GameEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (settleConfirmId !== ev.id) {
      setSettleConfirmId(ev.id);
      sound.play('select');
      showNotice(`جهت تسویه فوری و ارسال هدایا، مجدداً دکمه را لمس کنید.`);
      setTimeout(() => setSettleConfirmId(null), 4000);
      return;
    }
    setSettleConfirmId(null);
    const res = manuallySettleEvent(ev.id);
    sound.play('victory');
    refreshEvents();
    showNotice(
      `رویداد "${ev.title}" تسویه شد و ${res.giftsSent} پاداش به صندوق هدایای بازیکنان ارسال گردید!`
    );
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (!editingEvent.title.trim()) {
      showNotice('عنوان رویداد نمی‌تواند خالی باشد.');
      return;
    }
    if (editingEvent.endDate <= editingEvent.startDate) {
      showNotice('تاریخ پایان باید بعد از تاریخ شروع باشد.');
      return;
    }

    createOrUpdateEvent(editingEvent);
    sound.play('coin');
    refreshEvents();
    showNotice(`رویداد "${editingEvent.title}" ذخیره شد.`);
    setEditingEvent(null);
  };

  const handleAddRewardTier = () => {
    if (!editingEvent) return;
    const current = editingEvent.rewards || [];
    const lastTier = current[current.length - 1];
    const newFrom = lastTier ? lastTier.rankTo + 1 : 1;
    const newTo = newFrom + 4;

    const newTier: EventReward = {
      rankFrom: newFrom,
      rankTo: newTo,
      gold: 500,
      gems: 20,
      cardIds: [],
    };

    setEditingEvent({
      ...editingEvent,
      rewards: [...current, newTier],
    });
    sound.play('select');
  };

  const handleRemoveRewardTier = (idx: number) => {
    if (!editingEvent) return;
    const updated = editingEvent.rewards.filter((_, i) => i !== idx);
    setEditingEvent({ ...editingEvent, rewards: updated });
    sound.play('click');
  };

  return (
    <div className="w-full flex flex-col gap-6 text-stone-100 select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-amber-500/30 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-3xl shadow-lg border border-amber-300">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-amber-200">
                مدیریت و ادیتور رویدادها و جام‌ها
              </h2>
              <span className="bg-amber-500 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow">
                مسابقات هفتگی و ماهانه
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 max-w-xl">
              مسابقات و چالش‌های درون بازی را طراحی و زمان‌بندی کنید؛ تعیین جوایز نقدی، الماس، کارت‌های قهرمان و القاب ویژه
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleStartCreate('weekly', 'most_wins')}
            className="flex-1 md:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>🏆</span>
            <span>ایجاد جام هفتگی (بردها)</span>
          </button>
          <button
            onClick={() => handleStartCreate('monthly', 'most_level_ups')}
            className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>⚡</span>
            <span>ایجاد ماراتن ماهانه (ارتقا)</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-3.5 rounded-2xl text-center shadow animate-in fade-in">
          {notice}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`${editingEvent ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-4`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <span>📋</span>
              <span>لیست مسابقات و رویدادها ({events.length} مورد)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3.5">
            {events.map((ev) => {
              const isSelected = editingEvent?.id === ev.id;
              const isWeekly = ev.period === 'weekly';
              const isWins = ev.goalType === 'most_wins';
              const now = Date.now();
              const isExpired = ev.endDate < now;

              return (
                <div
                  key={ev.id}
                  onClick={() => handleEdit(ev)}
                  className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer shadow-lg relative flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 scale-[1.01]'
                      : ev.isActive && !isExpired
                      ? 'bg-stone-900/90 border-stone-800 hover:border-amber-500/60 hover:bg-stone-900'
                      : 'bg-stone-950/70 border-stone-800/60 opacity-65'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-stone-700 flex items-center justify-center text-2xl shadow-inner">
                        {ev.icon || (isWins ? '🏆' : '⚡')}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-black text-amber-200">{ev.title}</h4>
                          <span
                            className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${
                              isWeekly
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {isWeekly ? 'هفتگی' : 'ماهانه'}
                          </span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${
                              isWins
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            }`}
                          >
                            {isWins ? 'بیشترین برد' : 'بیشترین ارتقا'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                          {ev.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        onClick={(e) => handleSettleNow(ev, e)}
                        title="تسویه فوری و ارسال جوایز به صندوق ورودی برندگان"
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition border flex items-center gap-1 shadow cursor-pointer ${
                          settleConfirmId === ev.id
                            ? 'bg-amber-500 text-stone-950 border-amber-400 animate-pulse font-black'
                            : 'bg-purple-950/70 hover:bg-purple-900 border-purple-500/70 text-purple-200'
                        }`}
                      >
                        <span>🎁</span>
                        <span>
                          {settleConfirmId === ev.id
                            ? 'تایید تسویه؟'
                            : ev.isSettled
                            ? 'تسویه شده'
                            : 'تسویه جوایز'}
                        </span>
                      </button>
                      <button
                        onClick={(e) => handleToggleActive(ev, e)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-xl transition border cursor-pointer ${
                          ev.isActive && !isExpired
                            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                            : 'bg-stone-800 border-stone-700 text-stone-400'
                        }`}
                      >
                        {isExpired ? 'منقضی' : ev.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                      <button
                        onClick={(e) => handleDelete(ev.id, ev.title, e)}
                        className="w-7 h-7 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs flex items-center justify-center transition cursor-pointer"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Editor Form */}
        {editingEvent && (
          <div className="lg:col-span-7 bg-stone-900/90 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{editingEvent.icon || '🏆'}</span>
                <div>
                  <h3 className="text-base font-black text-amber-300">
                    {isCreatingNew ? 'طراحی و زمان‌بندی رویداد جدید' : 'ویرایش مسابقه'}
                  </h3>
                  <span className="text-xs text-stone-400 font-mono">شناسه: {editingEvent.id}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
              >
                انصراف
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 space-y-1">
                  <label className="font-bold text-stone-300">عنوان مسابقه:</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:outline-none focus:border-amber-400"
                    placeholder="مثال: جام هفتگی دلاوران..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-300">آیکون:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={editingEvent.icon}
                      onChange={(e) => setEditingEvent({ ...editingEvent, icon: e.target.value })}
                      className="w-14 bg-stone-950 border border-stone-700 rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex flex-wrap gap-1">
                      {PRESET_ICONS.slice(0, 4).map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, icon: ic })}
                          className="w-6 h-6 rounded-lg bg-stone-950 hover:bg-stone-800 flex items-center justify-center text-xs cursor-pointer"
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-300">توضیحات و قوانین مسابقه:</label>
                <textarea
                  rows={2}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="توضیحات رویداد..."
                />
              </div>

              {/* Tournament Artwork Selection */}
              <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                <label className="font-bold text-amber-300 block">تصویر و تمثال جام مسابقه:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'weekly', label: 'جام زرین هفتگی', url: GAME_VISUALS.eventWeeklyTrophy },
                    { id: 'monthly', label: 'مشعل جاودان ماهانه', url: GAME_VISUALS.eventMonthlyFlame },
                    { id: 'banner', label: 'بنر تالار قهرمانان', url: GAME_VISUALS.eventsArenaBanner },
                    { id: 'swords', label: 'نشان شمشیرهای دوئل', url: GAME_VISUALS.duelSwordsIcon },
                  ].map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setEditingEvent({ ...editingEvent, image: preset.url });
                        sound.play('select');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                        editingEvent.image === preset.url
                          ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/40'
                          : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-10 h-10 object-cover rounded-lg" />
                      <span className="text-[10px] font-bold text-stone-300 text-center truncate w-full">{preset.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1.5 border-t border-stone-800">
                  <input
                    type="text"
                    value={editingEvent.image && !editingEvent.image.startsWith('data:') ? editingEvent.image : ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value.trim() || undefined })}
                    placeholder="یا لینک تصویر اختصاصی مسابقه را وارد کنید..."
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                  />
                  <label className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow">
                    آپلود عکس 📁
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const r = new FileReader();
                          r.onload = (ev) => {
                            setEditingEvent({ ...editingEvent, image: ev.target?.result as string });
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800">
                <div className="space-y-1.5">
                  <label className="font-bold text-amber-300">دوره برگزاری:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, period: 'weekly' })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        editingEvent.period === 'weekly'
                          ? 'bg-amber-500 text-stone-950 shadow'
                          : 'bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      <span>📅</span>
                      <span>هفتگی (۷ روز)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, period: 'monthly' })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        editingEvent.period === 'monthly'
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      <span>🗓️</span>
                      <span>ماهانه (۳۰ روز)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-amber-300">هدف و معیار رتبه‌بندی:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, goalType: 'most_wins' })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        editingEvent.goalType === 'most_wins'
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      <span>⚔️</span>
                      <span>بیشترین پیروزی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, goalType: 'most_level_ups' })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        editingEvent.goalType === 'most_level_ups'
                          ? 'bg-cyan-600 text-stone-950 shadow'
                          : 'bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      <span>⭐</span>
                      <span>بیشترین ارتقا</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* REWARDS CONFIGURATION */}
              <div className="space-y-3 bg-stone-950/80 p-4 rounded-3xl border border-amber-500/30">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🎁</span>
                    <h4 className="font-black text-amber-300">جوایز و پاداش رتبه‌ها</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRewardTier}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-3 py-1 rounded-xl text-xs transition flex items-center gap-1 shadow cursor-pointer"
                  >
                    <span>+</span>
                    <span>افزودن بازه رتبه</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {editingEvent.rewards.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-stone-800 bg-stone-900/80 flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-amber-300">
                          بازه رتبه: {tier.rankFrom} تا {tier.rankTo}
                        </span>
                        {editingEvent.rewards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRewardTier(idx)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800 cursor-pointer"
                          >
                            حذف این بازه
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-amber-300">سکه طلا 💰:</label>
                          <input
                            type="number"
                            min={0}
                            step={50}
                            value={tier.gold}
                            onChange={(e) => {
                              const rewards = [...editingEvent.rewards];
                              rewards[idx].gold = Number(e.target.value) || 0;
                              setEditingEvent({ ...editingEvent, rewards });
                            }}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-cyan-300">الماس 💎:</label>
                          <input
                            type="number"
                            min={0}
                            step={5}
                            value={tier.gems}
                            onChange={(e) => {
                              const rewards = [...editingEvent.rewards];
                              rewards[idx].gems = Number(e.target.value) || 0;
                              setEditingEvent({ ...editingEvent, rewards });
                            }}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-purple-300">لقب اختصاصی (اختیاری):</label>
                          <input
                            type="text"
                            value={tier.titleBadge || ''}
                            onChange={(e) => {
                              const rewards = [...editingEvent.rewards];
                              rewards[idx].titleBadge = e.target.value;
                              setEditingEvent({ ...editingEvent, rewards });
                            }}
                            placeholder="مثلاً: 👑 قهرمان هفته"
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>💾</span>
                  <span>ذخیره و فعال‌سازی رویداد</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
