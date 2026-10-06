import React, { useState } from 'react';
import { ChestConfig, CardDef } from '../types/game';
import {
  loadChestConfigs,
  saveChestConfigs,
  pickCardByChestRates,
} from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface ChestEditorScreenProps {
  cardLibrary: CardDef[];
  onChestsUpdated?: (chests: ChestConfig[]) => void;
}

const CHEST_ICONS = ['📦', '🥈', '👑', '💎', '🎁', '🏺', '⚔️', '🔮', '🌟', '🛡️'];

const PRESET_CHEST_IMAGES = [
  { id: 'bronze', label: 'صندوق چوبی برنز', url: GAME_VISUALS.chestBronze },
  { id: 'silver', label: 'صندوق سیمین نقره', url: GAME_VISUALS.chestSilver },
  { id: 'gold', label: 'صندوق زرین طلا', url: GAME_VISUALS.chestGold },
  { id: 'mythic', label: 'صندوق سلطنتی جواهرنشان', url: GAME_VISUALS.chestMythic },
];

function createNewChestDraft(): ChestConfig {
  return {
    id: 'pack_' + Date.now(),
    title: 'صندوق اساطیری جدید',
    description: 'شامل کارت‌های نیرومند با شانس عالی...',
    price: 300,
    currency: 'gold',
    icon: '📦',
    image: GAME_VISUALS.chestBronze,
    colorTheme: 'from-amber-700 to-stone-900 border-amber-500',
    cardCount: 2,
    tierRates: {
      normal: 40,
      medium: 35,
      legendary: 20,
      god: 5,
    },
    guaranteedTier: 'none',
    isAvailable: true,
  };
}

export const ChestEditorScreen: React.FC<ChestEditorScreenProps> = ({
  cardLibrary,
  onChestsUpdated,
}) => {
  const [chests, setChests] = useState<ChestConfig[]>(() => loadChestConfigs());
  const [draftChest, setDraftChest] = useState<ChestConfig>(createNewChestDraft);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [simResults, setSimResults] = useState<CardDef[]>([]);
  const [customImgUrl, setCustomImgUrl] = useState<string>('');

  const totalPercentage =
    (draftChest.tierRates.normal || 0) +
    (draftChest.tierRates.medium || 0) +
    (draftChest.tierRates.legendary || 0) +
    (draftChest.tierRates.god || 0);

  const handleAutoBalancePercentages = () => {
    sound.play('click');
    const { normal, medium, legendary, god } = draftChest.tierRates;
    const currentSum = normal + medium + legendary + god;
    if (currentSum === 0) {
      setDraftChest({
        ...draftChest,
        tierRates: { normal: 40, medium: 35, legendary: 20, god: 5 },
      });
      return;
    }
    const factor = 100 / currentSum;
    const n = Math.round(normal * factor);
    const m = Math.round(medium * factor);
    const l = Math.round(legendary * factor);
    const g = 100 - (n + m + l);
    setDraftChest({
      ...draftChest,
      tierRates: { normal: n, medium: m, legendary: l, god: Math.max(0, g) },
    });
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setDraftChest({ ...draftChest, image: result });
        sound.play('coin');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChest = () => {
    if (!draftChest.title.trim()) {
      alert('نام صندوق را وارد کنید.');
      return;
    }
    if (draftChest.price <= 0) {
      alert('قیمت صندوق باید بزرگتر از صفر باشد.');
      return;
    }

    const currentChests = loadChestConfigs();
    const existingIdx = currentChests.findIndex((c) => c.id === draftChest.id);
    let updated: ChestConfig[];

    if (existingIdx >= 0) {
      updated = [...currentChests];
      updated[existingIdx] = draftChest;
      setNotice(`صندوق "${draftChest.title}" با موفقیت به‌روزرسانی شد!`);
    } else {
      updated = [...currentChests, draftChest];
      setNotice(`صندوق جدید "${draftChest.title}" اضافه شد!`);
    }

    saveChestConfigs(updated);
    setChests(updated);
    if (onChestsUpdated) onChestsUpdated(updated);
    sound.play('coin');
    setIsEditing(false);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleEditChest = (chest: ChestConfig) => {
    setDraftChest(JSON.parse(JSON.stringify(chest)));
    setIsEditing(true);
    sound.play('select');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteChest = (id: string, title: string) => {
    if (!confirm(`آیا از حذف صندوق "${title}" مطمئن هستید؟`)) return;
    const updated = chests.filter((c) => c.id !== id);
    saveChestConfigs(updated);
    setChests(updated);
    if (onChestsUpdated) onChestsUpdated(updated);
    sound.play('death');
  };

  const handleSimulateRoll = () => {
    sound.play('pack_open');
    const dropped: CardDef[] = [];
    for (let i = 0; i < draftChest.cardCount; i++) {
      const isGuaranteed = i === 0 && !!draftChest.guaranteedTier && draftChest.guaranteedTier !== 'none';
      const c = pickCardByChestRates(cardLibrary, draftChest, isGuaranteed);
      dropped.push(c);
    }
    setSimResults(dropped);
  };

  return (
    <div className="flex flex-col gap-4 text-stone-100 select-none">
      {notice && (
        <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-3.5 rounded-2xl text-center shadow-lg font-bold animate-in fade-in">
          {notice}
        </div>
      )}

      {/* Editor Form Box */}
      <div className="bg-stone-900/95 border-2 border-amber-500/70 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            {draftChest.image ? (
              <img src={draftChest.image} alt="Chest" className="w-10 h-10 rounded-2xl object-cover border border-amber-500/80 shadow" />
            ) : (
              <span className="text-3xl">📦</span>
            )}
            <div>
              <h3 className="text-base font-black text-amber-300">
                {isEditing ? `ویرایش صندوق: ${draftChest.title}` : 'طراحی و ساخت صندوق شانس جدید'}
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                تنظیم دقیق شانس رده‌های مختلف (Drop Rate)، تصویر، قیمت و کارت‌های تضمینی
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={() => {
                  setDraftChest(createNewChestDraft());
                  setIsEditing(false);
                  sound.play('click');
                }}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
              >
                انصراف و صندوق جدید
              </button>
            )}
            <button
              onClick={handleSaveChest}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <img src={GAME_VISUALS.coinIcon} alt="Save" className="w-4 h-4 rounded-full" />
              <span>ذخیره صندوق در فروشگاه</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="text-stone-300 font-bold block mb-1">نام صندوق:</label>
            <input
              type="text"
              maxLength={30}
              value={draftChest.title}
              onChange={(e) => setDraftChest({ ...draftChest, title: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-stone-300 font-bold block mb-1">نوع ارز پرداختی:</label>
            <select
              value={draftChest.currency}
              onChange={(e) => setDraftChest({ ...draftChest, currency: e.target.value as any })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
            >
              <option value="gold">سکه طلا 💰</option>
              <option value="gems">الماس جادویی 💎</option>
            </select>
          </div>

          <div>
            <label className="text-stone-300 font-bold block mb-1">
              قیمت خرید ({draftChest.currency === 'gems' ? 'الماس' : 'طلا'}):
            </label>
            <input
              type="number"
              min={1}
              step={draftChest.currency === 'gems' ? 1 : 25}
              value={draftChest.price}
              onChange={(e) => setDraftChest({ ...draftChest, price: parseInt(e.target.value) || 1 })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-amber-300 font-black focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-stone-300 font-bold block mb-1">تعداد کارت‌های اهدایی:</label>
            <input
              type="number"
              min={1}
              max={6}
              value={draftChest.cardCount}
              onChange={(e) =>
                setDraftChest({
                  ...draftChest,
                  cardCount: Math.max(1, Math.min(6, parseInt(e.target.value) || 1)),
                })
              }
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-black focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-stone-300 font-bold block mb-1">حداقل رده تضمین‌شده:</label>
            <select
              value={draftChest.guaranteedTier || 'none'}
              onChange={(e) => setDraftChest({ ...draftChest, guaranteedTier: e.target.value as any })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
            >
              <option value="none">بدون تضمین (کاملاً شانسی)</option>
              <option value="medium">رده متوسط به بالا</option>
              <option value="legendary">رده افسانه‌ای به بالا</option>
              <option value="god">رده خداگونه (God)</option>
            </select>
          </div>

          <div>
            <label className="text-stone-300 font-bold block mb-1">آیکون صندوق:</label>
            <div className="flex gap-1.5 flex-wrap">
              {CHEST_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setDraftChest({ ...draftChest, icon: ic })}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition cursor-pointer ${
                    draftChest.icon === ic
                      ? 'bg-amber-500/20 border-2 border-amber-400 scale-110 shadow'
                      : 'bg-stone-950 border border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* IMAGE SELECTION FOR CHEST */}
          <div className="sm:col-span-2 md:col-span-3 bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-2">
            <label className="text-amber-300 font-black block">تصویر و گرافیک اختصاصی صندوق:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_CHEST_IMAGES.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    setDraftChest({ ...draftChest, image: preset.url });
                    sound.play('select');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition ${
                    draftChest.image === preset.url
                      ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-12 h-12 object-cover rounded-lg" />
                  <span className="text-[10px] font-bold text-stone-300 text-center truncate w-full">{preset.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-stone-800">
              <input
                type="text"
                value={customImgUrl}
                onChange={(e) => setCustomImgUrl(e.target.value)}
                placeholder="یا آدرس اینترنتی تصویر را وارد کنید..."
                className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (customImgUrl.trim()) {
                    setDraftChest({ ...draftChest, image: customImgUrl.trim() });
                    sound.play('coin');
                  }
                }}
                className="bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
              >
                اعمال آدرس 🔗
              </button>
              <label className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow">
                آپلود عکس 📁
                <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="sm:col-span-2 md:col-span-3">
            <label className="text-stone-300 font-bold block mb-1">توضیحات کوتاه صندوق:</label>
            <textarea
              rows={2}
              maxLength={120}
              value={draftChest.description}
              onChange={(e) => setDraftChest({ ...draftChest, description: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* DROP RATES SECTION */}
        <div className="bg-stone-950/90 rounded-2xl p-4 border border-amber-500/40 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>🎯</span>
                <span>درصد شانس کارت‌ها (Drop Rates):</span>
              </h4>
              <p className="text-[10px] text-stone-400 mt-0.5">
                مجموع درصد شانس ۴ رده باید دقیقاً برابر با ۱۰۰٪ باشد.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                  totalPercentage === 100
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                }`}
              >
                مجموع: {totalPercentage}% {totalPercentage !== 100 && '(نیاز به بالانس)'}
              </span>
              <button
                type="button"
                onClick={handleAutoBalancePercentages}
                className="bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-[11px] font-bold px-3 py-1 rounded-xl transition shadow cursor-pointer"
              >
                تراز خودکار ۱۰۰٪ ⚖️
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Normal Tier */}
            <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-300">رده عادی:</span>
                <span className="text-amber-300 font-black">{draftChest.tierRates.normal}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={draftChest.tierRates.normal}
                onChange={(e) =>
                  setDraftChest({
                    ...draftChest,
                    tierRates: {
                      ...draftChest.tierRates,
                      normal: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Medium Tier */}
            <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-300">رده متوسط:</span>
                <span className="text-blue-300 font-black">{draftChest.tierRates.medium}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={draftChest.tierRates.medium}
                onChange={(e) =>
                  setDraftChest({
                    ...draftChest,
                    tierRates: {
                      ...draftChest.tierRates,
                      medium: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Legendary Tier */}
            <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-300">رده افسانه‌ای:</span>
                <span className="text-purple-300 font-black">{draftChest.tierRates.legendary}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={draftChest.tierRates.legendary}
                onChange={(e) =>
                  setDraftChest({
                    ...draftChest,
                    tierRates: {
                      ...draftChest.tierRates,
                      legendary: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* God Tier */}
            <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-rose-400">رده خداگونه:</span>
                <span className="text-rose-400 font-black">{draftChest.tierRates.god}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={draftChest.tierRates.god}
                onChange={(e) =>
                  setDraftChest({
                    ...draftChest,
                    tierRates: {
                      ...draftChest.tierRates,
                      god: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Simulator Button */}
        <div className="flex items-center justify-between border-t border-stone-800 pt-3">
          <button
            type="button"
            onClick={handleSimulateRoll}
            className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500 text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
          >
            <span>🎲</span>
            <span>تست و شبیه‌سازی گشایش صندوق (Roll Test)</span>
          </button>
          {simResults.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">کارت‌های شبیه‌سازی شده:</span>
              <div className="flex items-center gap-1.5">
                {simResults.map((c, i) => (
                  <span
                    key={i}
                    className="bg-stone-950 border border-amber-500/60 text-amber-300 font-bold px-2 py-0.5 rounded-lg text-xs"
                  >
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing Chests List */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
          <span>📋</span>
          <span>صندوق‌های فعال موجود در فروشگاه ({chests.length} نوع)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {chests.map((chest) => (
            <div
              key={chest.id}
              className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/60 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-xl transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2.5">
                    {chest.image ? (
                      <img src={chest.image} alt={chest.title} className="w-10 h-10 object-cover rounded-xl border border-amber-500/50 shadow" />
                    ) : (
                      <span className="text-2xl">{chest.icon}</span>
                    )}
                    <div>
                      <h5 className="font-black text-amber-300 text-sm">{chest.title}</h5>
                      <span className="text-[10px] text-stone-400">حاوی {chest.cardCount} کارت</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-xl border border-amber-500/40">
                    {chest.price} {chest.currency === 'gems' ? '💎' : '💰'}
                  </span>
                </div>

                <p className="text-xs text-stone-400 leading-relaxed mb-3">{chest.description}</p>

                <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <div>
                    <div className="text-stone-400">عادی</div>
                    <div className="text-amber-300">{chest.tierRates.normal}%</div>
                  </div>
                  <div>
                    <div className="text-blue-400">متوسط</div>
                    <div className="text-blue-300">{chest.tierRates.medium}%</div>
                  </div>
                  <div>
                    <div className="text-purple-400">افسانه</div>
                    <div className="text-purple-300">{chest.tierRates.legendary}%</div>
                  </div>
                  <div>
                    <div className="text-rose-400">خداگونه</div>
                    <div className="text-rose-300">{chest.tierRates.god}%</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                <button
                  onClick={() => handleEditChest(chest)}
                  className="flex-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 font-bold text-xs py-1.5 rounded-xl border border-amber-500/40 transition cursor-pointer"
                >
                  ویرایش ✏️
                </button>
                <button
                  onClick={() => handleDeleteChest(chest.id, chest.title)}
                  className="bg-rose-950/40 hover:bg-rose-900 border border-rose-600/60 text-rose-300 font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  حذف 🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
