import React, { useState, useEffect } from 'react';
import {
  CardDef,
  CardType,
  CardTier,
  AbilityPhase,
  CardAbility,
  CardPassives,
  UserProfile,
  GameAssetImage,
} from '../types/game';
import { CardView } from './CardView';
import { ChestEditorScreen } from './ChestEditorScreen';
import { EventEditorScreen } from './EventEditorScreen';
import { AuthEditorSection } from './AuthEditorSection';
import { UsdAdminFinancePanel } from './UsdAdminFinancePanel';
import { CardDuelSimulator } from './CardDuelSimulator';
import {
  CARD_ARCHETYPES,
  AURA_OPTIONS,
  TARGET_CRITERIA_OPTIONS,
  SOUND_PRESETS,
  calculateCardPowerScore,
} from './CardEditorHelpers';
import {
  saveCards,
  defaultPassives,
  loadGameImages,
  addGameImage,
  updateGameImage,
  deleteGameImage,
  resetDefaultGameImages,
  seedFreshMythicalCards,
} from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface CardEditorScreenProps {
  cardLibrary: CardDef[];
  user: UserProfile | null;
  onUpdateCards: (cards: CardDef[]) => void;
  onTestBattle?: (customCard: CardDef) => void;
}

const TYPE_OPTIONS: { id: CardType; label: string; desc: string }[] = [
  { id: 'attacker', label: 'تازشگر (Attacker)', desc: 'قدرت حمله بالا' },
  { id: 'defender', label: 'پاسدار (Defender)', desc: 'محافظت از ردیف عقب' },
  { id: 'mage', label: 'افسونگر (Mage)', desc: 'شفا و جادوهای راه دور' },
  { id: 'king', label: 'پادشاه (King)', desc: 'فرمانده ارتش (الزامی)' },
  { id: 'spell', label: 'افسون (Spell)', desc: 'تک‌مصرف در شروع نبرد' },
  { id: 'god', label: 'خداگونه (God)', desc: 'مصون از افکت‌های منفی' },
  { id: 'both', label: 'دوطرفه (Both)', desc: 'حمله و دفاع همزمان' },
];

const TIER_OPTIONS: { id: CardTier; label: string }[] = [
  { id: 'normal', label: 'رده عادی (Normal)' },
  { id: 'medium', label: 'رده متوسط (Medium)' },
  { id: 'legendary', label: 'رده افسانه‌ای (Legendary) 🌟' },
  { id: 'god', label: 'رده خداگونه (God Tier) ✨' },
];

const PRESET_COLORS = [
  '#3e2723', '#ffb300', '#b71c1c', '#1565c0', '#2e7d32', '#6a1b9a',
  '#ffd700', '#ff6ec7', '#00e5ff', '#00c853', '#ff6d00', '#ffffff'
];

interface PassiveMeta {
  key: keyof CardPassives;
  icon: string;
  label: string;
  desc: string;
  hasAmount?: boolean;
  unit?: string;
  def?: number;
}

const PASSIVE_DEFS: PassiveMeta[] = [
  { key: 'doubleStrike', icon: '🗡️', label: 'حمله دوگانه', desc: 'در هر حمله ۲ بار پیاپی ضربه می‌زند' },
  { key: 'cleave', icon: '🪓', label: 'برش جانبی', desc: 'کارت‌های چپ و راست هدف نصف آسیب را دریافت می‌کنند' },
  { key: 'crit', icon: '💥', label: 'ضربه بحرانی', desc: 'با شانس درصدی، آسیب دوبرابر وارد می‌کند', hasAmount: true, unit: '%', def: 30 },
  { key: 'resurrect', icon: '👼', label: 'رستاخیز اساطیری', desc: 'یک‌بار پس از مرگ با درصدی از جان زنده می‌شود', hasAmount: true, unit: '% جان', def: 50 },
  { key: 'lastStand', icon: '💪', label: 'جان سخت', desc: 'اولین ضربه مرگبار را با ۱ جان زنده می‌ماند' },
  { key: 'regen', icon: '💚', label: 'بازسازی جان', desc: 'شروع هر نوبت این مقدار جان شفا می‌یابد', hasAmount: true, unit: 'جان', def: 2 },
  { key: 'berserk', icon: '😤', label: 'خشم نبرد', desc: 'با هر بار ضربه خوردن این مقدار حمله می‌گیرد', hasAmount: true, unit: 'قدرت', def: 2 },
  { key: 'rage', icon: '🔥', label: 'خشم پیوسته', desc: 'شروع هر نوبت صاحبش قدرت حمله می‌گیرد', hasAmount: true, unit: 'قدرت', def: 1 },
  { key: 'pierce', icon: '⚡', label: 'زره‌شکن', desc: 'سپر دفاعی هدف را دور می‌زند' },
  { key: 'ignoreGuard', icon: '🏹', label: 'تک‌تیرانداز', desc: 'پاسدارها و تحریک را نادیده می‌گیرد' },
  { key: 'stealth', icon: '👻', label: 'استتار', desc: 'تا وقتی یار دیگری زنده است هدف قرار نمی‌گیرد' },
];

const PHASE_LABELS: Record<AbilityPhase, string> = {
  onStart: '🌟 شروع بازی (On Start)',
  onTurnStart: '🔄 شروع هر نوبت (On Turn Start)',
  onAttack: '⚔️ هنگام حمله (On Attack)',
  onDefend: '🛡️ هنگام دفاع (On Defend)',
  onKill: '🎯 هنگام کشتن (On Kill)',
  onDeath: '💀 بعد از مرگ (On Death)',
};

const ACTION_META: Record<string, { unit?: string; auto?: boolean; noAmount?: boolean }> = {
  destroyMage:     { unit: 'تعداد' },
  destroyDefender: { unit: 'تعداد' },
  destroyAttacker: { unit: 'تعداد' },
  heal:            { unit: 'جان' },
  damage:          { unit: 'آسیب' },
  thorns:          { unit: 'آسیب پاتک' },
  buffAttack:      { unit: 'قدرت' },
  nerfAttack:      { unit: 'کاهش قدرت' },
  freeze:          { unit: 'تعداد' },
  counterAttack:   { unit: 'آسیب متقابل', auto: true },
  shield:          { unit: 'جذب سپر' },
  poison:          { unit: 'آسیب/نوبت' },
  lifesteal:       { unit: 'جان دریافتی', auto: true },
  taunt:           { noAmount: true },
  dodge:           { unit: 'درصد %' },
  execute:         { unit: 'جان آستانه' },
  silence:         { unit: 'تعداد' },
  burn:            { unit: 'آسیب/نوبت' },
  maxHpUp:         { unit: 'حداکثر جان' },
  maxHpDown:       { unit: 'کاهش جان' },
  stealAttack:     { unit: 'قدرت دزدی' },
  drain:           { unit: 'آسیب مکش' },
  splash:          { unit: 'آسیب موجی' },
  cleanse:         { noAmount: true },
  dispel:          { noAmount: true },
  summon:          { unit: 'قدرت/جان روح' },
  healFull:        { noAmount: true },
};

const DEFAULT_AMOUNTS: Record<string, number> = {
  destroyMage: 1, destroyDefender: 1, destroyAttacker: 1, heal: 3, damage: 3,
  thorns: 3, buffAttack: 2, nerfAttack: 2, freeze: 1, counterAttack: 8, shield: 5, poison: 2, lifesteal: 4,
  taunt: 1, dodge: 30, execute: 5, silence: 1, burn: 2, maxHpUp: 5, maxHpDown: 3, stealAttack: 3, drain: 4,
  splash: 4, cleanse: 1, dispel: 1, summon: 3, healFull: 1,
};

const DEFAULT_SIDE: Record<string, 'ally' | 'enemy'> = {
  heal: 'ally', shield: 'ally', taunt: 'ally', dodge: 'ally', buffAttack: 'ally', thorns: 'ally',
  cleanse: 'ally', healFull: 'ally', maxHpUp: 'ally', summon: 'ally',
  dispel: 'enemy', stealAttack: 'enemy', maxHpDown: 'enemy', burn: 'enemy', silence: 'enemy',
  execute: 'enemy', splash: 'enemy', drain: 'enemy', damage: 'enemy', freeze: 'enemy', poison: 'enemy',
  nerfAttack: 'enemy', destroyMage: 'enemy', destroyDefender: 'enemy', destroyAttacker: 'enemy',
};

const ABILITY_DEFS: Record<AbilityPhase, { action: string; label: string; icon: string }[]> = {
  onStart: [
    { action: 'destroyMage',     label: 'نابودی افسونگر',  icon: '💀' },
    { action: 'destroyDefender', label: 'نابودی پاسدار',   icon: '💀' },
    { action: 'destroyAttacker', label: 'نابودی تازشگر',   icon: '💀' },
    { action: 'heal',            label: 'بالا بردن جان',    icon: '❤️' },
    { action: 'damage',          label: 'ضربه زدن مستقیم',         icon: '⚔️' },
    { action: 'thorns',          label: 'خار دفاعی (پاتک)',    icon: '🌵' },
    { action: 'buffAttack',      label: 'افزایش قدرت حمله',   icon: '⬆️' },
    { action: 'nerfAttack',      label: 'کاهش قدرت دشمن', icon: '⬇️' },
    { action: 'freeze',          label: 'یخ زدن دشمنان',      icon: '❄️' },
    { action: 'shield',          label: 'سپر دفاعی (جذب)',   icon: '🛡️' },
    { action: 'poison',          label: 'زهرآلود کردن',    icon: '☠️' },
    { action: 'taunt',           label: 'تحریک نبرد',            icon: '🎯' },
    { action: 'dodge',           label: 'جاخالی درصدی',           icon: '💨' },
    { action: 'execute',         label: 'اعدام کم‌جان‌ها',   icon: '🪦' },
    { action: 'silence',         label: 'سکوت (قطع قابلیت)', icon: '🔇' },
    { action: 'burn',            label: 'آتش زدن',           icon: '🔥' },
    { action: 'maxHpUp',         label: 'افزایش حداکثر جان',         icon: '💖' },
    { action: 'maxHpDown',       label: 'تضعیف جان ماکزیمم',       icon: '🩹' },
    { action: 'stealAttack',     label: 'دزدی قدرت حمله',         icon: '🥷' },
    { action: 'drain',           label: 'مکیدن جان',             icon: '🧛' },
    { action: 'splash',          label: 'موج گسترده',        icon: '🌊' },
    { action: 'cleanse',         label: 'پاکسازی یاران',   icon: '🧼' },
    { action: 'dispel',          label: 'زدودن جادوی حریف',  icon: '🌪️' },
    { action: 'summon',          label: 'احضار روح یاری‌رسان',         icon: '👻' },
    { action: 'healFull',        label: 'شفای کامل ۱۰۰٪',         icon: '✨' },
  ],
  onTurnStart: [
    { action: 'heal',       label: 'بازسازی جان',    icon: '❤️' },
    { action: 'damage',     label: 'ضربه زدن نوبتی',        icon: '⚔️' },
    { action: 'thorns',     label: 'افزایش خار',             icon: '🌵' },
    { action: 'buffAttack', label: 'افزایش قدرت',      icon: '⬆️' },
    { action: 'nerfAttack', label: 'کاهش قدرت دشمن',  icon: '⬇️' },
    { action: 'freeze',     label: 'انجماد هدف',          icon: '❄️' },
    { action: 'shield',     label: 'تجدید سپر',             icon: '🛡️' },
    { action: 'poison',     label: 'پاشیدن زهر',             icon: '☠️' },
    { action: 'taunt',      label: 'تحریک نبرد',           icon: '🎯' },
    { action: 'dodge',      label: 'تقویت جاخالی',          icon: '💨' },
    { action: 'burn',       label: 'آتش زدن',         icon: '🔥' },
    { action: 'stealAttack',label: 'دزدی قدرت',       icon: '🥷' },
    { action: 'cleanse',    label: 'پاکسازی اثرات منفی', icon: '🧼' },
    { action: 'dispel',     label: 'زدودن جادو',      icon: '🌪️' },
    { action: 'summon',     label: 'احضار روح',       icon: '👻' },
    { action: 'healFull',   label: 'شفای کامل',       icon: '✨' },
    { action: 'maxHpUp',    label: 'افزایش سقف جان',       icon: '💖' },
  ],
  onAttack: [
    { action: 'lifesteal',  label: 'جان‌خواری خودکار (حمله‌کننده)', icon: '🩸' },
    { action: 'heal',       label: 'شفای یاران',    icon: '❤️' },
    { action: 'damage',     label: 'آسیب مازاد',          icon: '⚔️' },
    { action: 'thorns',     label: 'خار',               icon: '🌵' },
    { action: 'buffAttack', label: 'افزایش قدرت',        icon: '⬆️' },
    { action: 'freeze',     label: 'انجماد هدف ضربه',            icon: '❄️' },
    { action: 'poison',     label: 'مسموم‌سازی هدف',     icon: '☠️' },
    { action: 'shield',     label: 'سپر',               icon: '🛡️' },
    { action: 'execute',    label: 'اعدام فوری هدف',    icon: '🪦' },
    { action: 'silence',    label: 'سکوت هدف ضربه',              icon: '🔇' },
    { action: 'burn',       label: 'آتش زدن هدف',           icon: '🔥' },
    { action: 'drain',      label: 'مکیدن جان هدف',             icon: '🧛' },
    { action: 'splash',     label: 'آسیب موجی به اطراف',        icon: '🌊' },
    { action: 'stealAttack',label: 'دزدی قدرت هدف',         icon: '🥷' },
    { action: 'maxHpDown',  label: 'کاهش سقف جان هدف',         icon: '🩹' },
    { action: 'dispel',     label: 'زدودن سپرهای هدف',        icon: '🌪️' },
  ],
  onDefend: [
    { action: 'counterAttack', label: 'ضربه متقابل به حمله‌کننده', icon: '🗡️' },
    { action: 'damage',        label: 'آسیب انتقامی به کل میدان',  icon: '⚔️' },
    { action: 'heal',          label: 'شفا هنگام آسیب',               icon: '❤️' },
    { action: 'buffAttack',    label: 'افزایش قدرت در دفاع',                  icon: '⬆️' },
    { action: 'nerfAttack',    label: 'کاهش قدرت حمله‌کننده',                   icon: '⬇️' },
    { action: 'freeze',        label: 'انجماد حمله‌کننده',                      icon: '❄️' },
    { action: 'poison',        label: 'مسموم‌سازی حمله‌کننده',               icon: '☠️' },
    { action: 'shield',        label: 'تجدید سپر دفاعی',                         icon: '🛡️' },
    { action: 'thorns',        label: 'خار دفاعی',                         icon: '🌵' },
    { action: 'dodge',         label: 'جاخالی',                      icon: '💨' },
    { action: 'taunt',         label: 'تحریک مجدد',                       icon: '🎯' },
    { action: 'silence',       label: 'سکوت حمله‌کننده',             icon: '🔇' },
    { action: 'burn',          label: 'آتش زدن حمله‌کننده',          icon: '🔥' },
    { action: 'dispel',        label: 'زدودن جادوی مهاجم',                  icon: '🌪️' },
    { action: 'cleanse',       label: 'پاکسازی یاران',             icon: '🧼' },
    { action: 'healFull',      label: 'شفای کامل',                   icon: '✨' },
    { action: 'maxHpDown',     label: 'کاهش سقف جان مهاجم',                   icon: '🩹' },
  ],
  onKill: [
    { action: 'lifesteal',  label: 'مکیدن جان بعد از قتل', icon: '🩸' },
    { action: 'heal',       label: 'شفای تمام ارتش',    icon: '❤️' },
    { action: 'buffAttack', label: 'افزایش قدرت بعد از پیروزی',        icon: '⬆️' },
    { action: 'damage',     label: 'انفجار پس از کشتن',           icon: '⚔️' },
    { action: 'shield',     label: 'سپر پیروزی',                icon: '🛡️' },
    { action: 'thorns',     label: 'خار',                icon: '🌵' },
  ],
  onDeath: [
    { action: 'heal',       label: 'شفای یاران بعد از مرگ',   icon: '❤️' },
    { action: 'damage',     label: 'انفجار نهایی مرگبار',         icon: '💥' },
    { action: 'thorns',     label: 'پاتک مرگبار به قاتل',     icon: '🌵' },
    { action: 'buffAttack', label: 'میراث قدرت به یاران',  icon: '⬆️' },
    { action: 'poison',     label: 'پاشیدن زهر مرگبار',    icon: '☠️' },
    { action: 'freeze',     label: 'یخبندان کل دشمنان',           icon: '❄️' },
    { action: 'shield',     label: 'سپر محافظ به بازماندگان',   icon: '🛡️' },
    { action: 'burn',       label: 'آتش زدن میدان',          icon: '🔥' },
    { action: 'silence',    label: 'سکوت کامل دشمنان',             icon: '🔇' },
    { action: 'summon',     label: 'احضار روح نگهبان',        icon: '👻' },
    { action: 'dispel',     label: 'پاکسازی جادوها',       icon: '🌪️' },
    { action: 'maxHpDown',  label: 'تضعیف جان دشمنان',        icon: '🩹' },
  ],
};

function createFreshCard(): CardDef {
  return {
    id: 'hero_' + Date.now(),
    name: 'قهرمان اساطیری جدید',
    type: 'attacker',
    tier: 'normal',
    attack: 10,
    health: 20,
    icon: '🧙‍♂️',
    image: null,
    borderColor: '#ffb300',
    shopPrice: 350,
    sounds: { start: null, attack: null, death: null },
    passives: defaultPassives(),
    abilities: {
      onStart: [],
      onTurnStart: [],
      onAttack: [],
      onDefend: [],
      onKill: [],
      onDeath: [],
    },
  };
}

interface SavedSetup {
  id: string;
  name: string;
  layout: (CardDef | null)[][];
}

export const CardEditorScreen: React.FC<CardEditorScreenProps> = ({
  cardLibrary,
  user,
  onUpdateCards,
  onTestBattle,
}) => {
  const [editorTab, setEditorTab] = useState<'card' | 'images' | 'chests' | 'events' | 'auth' | 'usd'>('card');
  const [draftCard, setDraftCard] = useState<CardDef>(createFreshCard);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [codeImportText, setCodeImportText] = useState('');

  // 6x3 Interactive Board for placing cards & testing setups
  const [editorBoard, setEditorBoard] = useState<(CardDef | null)[][]>(() => {
    const b: (CardDef | null)[][] = Array.from({ length: 6 }, () => Array(3).fill(null));
    if (cardLibrary.length > 0) {
      b[0][1] = cardLibrary[0];
      b[1][1] = cardLibrary[1] || cardLibrary[0];
      b[5][1] = cardLibrary[0];
    }
    return b;
  });
  const [placingDef, setPlacingDef] = useState<CardDef | null>(null);

  // Setups Management
  const [setupNameInput, setSetupNameInput] = useState('');
  const [savedSetups, setSavedSetups] = useState<SavedSetup[]>(() => {
    try {
      const s = localStorage.getItem('nabard_setups_v2');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  // Images state
  const [gameImages, setGameImages] = useState<GameAssetImage[]>(() => loadGameImages());
  const [newImgName, setNewImgName] = useState('');
  const [newImgCategory, setNewImgCategory] = useState<'heroes' | 'kings' | 'mages' | 'creatures' | 'custom'>('custom');
  const [newImgData, setNewImgData] = useState<string | null>(null);
  const [newImgUrlInput, setNewImgUrlInput] = useState('');
  const [imageFilterCat, setImageFilterCat] = useState<string>('all');

  // Edit image modal state
  const [editingImage, setEditingImage] = useState<GameAssetImage | null>(null);
  const [editImgName, setEditImgName] = useState('');
  const [editImgCategory, setEditImgCategory] = useState<'heroes' | 'kings' | 'mages' | 'creatures' | 'custom'>('custom');
  const [editImgData, setEditImgData] = useState<string | null>(null);
  const [editImgUrlInput, setEditImgUrlInput] = useState('');

  // Advanced Card Editor States
  const [showDuelModal, setShowDuelModal] = useState<boolean>(false);
  const [showArchetypeModal, setShowArchetypeModal] = useState<boolean>(false);
  const [showSoundModalFor, setShowSoundModalFor] = useState<'start' | 'attack' | 'death' | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('nabard_setups_v2', JSON.stringify(savedSetups));
    } catch {}
  }, [savedSetups]);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Archetype applicator
  const handleApplyArchetype = (arch: (typeof CARD_ARCHETYPES)[0]) => {
    setDraftCard({
      ...createFreshCard(),
      name: arch.name,
      icon: arch.icon,
      type: arch.type,
      tier: arch.tier,
      attack: arch.attack,
      health: arch.health,
      borderColor: arch.borderColor,
      aura: arch.aura || 'none',
      shopPrice: arch.shopPrice,
      description: arch.description,
      passives: { ...arch.passives },
      abilities: JSON.parse(JSON.stringify(arch.abilities)),
    });
    setShowArchetypeModal(false);
    sound.play('victory');
    showToast(`الگوی ${arch.name} با موفقیت بارگذاری شد!`);
  };

  // Sound preset selector
  const handleSelectSoundPreset = (type: 'start' | 'attack' | 'death', soundKey: string) => {
    sound.play(soundKey);
    setDraftCard((prev) => ({
      ...prev,
      sounds: {
        ...(prev.sounds || {}),
        [type]: soundKey,
      },
    }));
    setShowSoundModalFor(null);
    showToast(`صدای ${type === 'start' ? 'شروع' : type === 'attack' ? 'حمله' : 'مرگ'} با موفقیت تنظیم شد.`);
  };

  // Export all cards as JSON
  const handleExportAllCardsJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cardLibrary, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `nabard_cards_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      sound.play('coin');
      showToast('فایل JSON کارت‌ها دانلود شد.');
    } catch {
      showToast('خطا در صدور فایل JSON.');
    }
  };

  // Import all cards from JSON file
  const handleImportAllCardsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
          saveCards(parsed);
          onUpdateCards(parsed);
          sound.play('victory');
          showToast(`${parsed.length} کارت از فایل JSON وارد شد!`);
        } else {
          showToast('فرمت فایل نامعتبر است.');
        }
      } catch {
        showToast('خطا در خواندن فایل JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to original Shahnameh Mythical Cards
  const handleResetToMythicalCards = () => {
    if (!confirm('آیا از بازنشانی کارت‌ها به کارت‌های اساطیری پیش‌فرض شاهنامه مطمئن هستید؟')) return;
    const restored = seedFreshMythicalCards();
    onUpdateCards(restored);
    sound.play('victory');
    showToast('کارت‌های اساطیری با موفقیت بازنشانی شدند!');
  };

  // Sound handler for card sounds
  const handlePlayCardSound = (type: 'start' | 'attack' | 'death') => {
    const src = draftCard.sounds?.[type];
    if (!src) {
      showToast('صدایی برای این بخش ثبت نشده است.');
      return;
    }
    const preset = SOUND_PRESETS.find((p) => p.id === src);
    if (preset) {
      sound.play(preset.id);
      return;
    }
    try {
      const a = new Audio(src);
      a.volume = 0.85;
      a.play().catch(() => {});
    } catch {}
  };

  const handleAudioUpload = (type: 'start' | 'attack' | 'death', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      showToast('فایل صوتی انتخابی بزرگ است؛ برای ذخیره بهتر فایل‌های کوچک‌تر را انتخاب کنید.');
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUri = ev.target?.result as string;
      setDraftCard((prev) => ({
        ...prev,
        sounds: {
          ...(prev.sounds || {}),
          [type]: dataUri,
        },
      }));
      sound.play('coin');
      showToast(`صدای اختصاصی ${type === 'start' ? 'شروع' : type === 'attack' ? 'حمله' : 'مرگ'} با موفقیت افزوده شد.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAudio = (type: 'start' | 'attack' | 'death') => {
    setDraftCard((prev) => ({
      ...prev,
      sounds: {
        ...(prev.sounds || {}),
        [type]: null,
      },
    }));
    sound.play('click');
    showToast('صدای این بخش حذف شد.');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 220;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        const ctx = cv.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          const dataUri = cv.toDataURL('image/jpeg', 0.85);
          setDraftCard((prev) => ({ ...prev, image: dataUri }));
          sound.play('coin');
          showToast('عکس کارت افزوده شد.');
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Passive Toggle
  const togglePassive = (def: PassiveMeta) => {
    sound.play('click');
    setDraftCard((prev) => {
      const current = prev.passives?.[def.key];
      const nextPassives = { ...(prev.passives || defaultPassives()) };
      if (def.hasAmount) {
        if (typeof current === 'number' && current > 0) {
          nextPassives[def.key] = 0;
        } else {
          nextPassives[def.key] = def.def || 10;
        }
      } else {
        nextPassives[def.key] = !current;
      }
      return { ...prev, passives: nextPassives };
    });
  };

  const handlePassiveAmountChange = (key: keyof CardPassives, val: number) => {
    setDraftCard((prev) => ({
      ...prev,
      passives: {
        ...(prev.passives || defaultPassives()),
        [key]: Math.max(0, val),
      },
    }));
  };

  // Ability Management
  const handleAddAbility = (phase: AbilityPhase, opt: { action: string; label: string; icon: string }) => {
    sound.play('select');
    const newAb: CardAbility = {
      id: 'ab_' + Date.now() + Math.random().toString(36).substring(2, 6),
      action: opt.action,
      label: opt.label,
      icon: opt.icon,
      amount: DEFAULT_AMOUNTS[opt.action] ?? 1,
      targetSide: DEFAULT_SIDE[opt.action] || 'enemy',
      positions: DEFAULT_SIDE[opt.action] === 'ally' ? [[3, 0], [3, 1], [3, 2]] : [[0, 0], [0, 1], [0, 2]],
    };
    setDraftCard((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [phase]: [...(prev.abilities[phase] || []), newAb],
      },
    }));
  };

  const handleRemoveAbility = (phase: AbilityPhase, abIndex: number) => {
    sound.play('click');
    setDraftCard((prev) => {
      const nextPhaseList = [...prev.abilities[phase]];
      nextPhaseList.splice(abIndex, 1);
      return {
        ...prev,
        abilities: {
          ...prev.abilities,
          [phase]: nextPhaseList,
        },
      };
    });
  };

  const toggleGridPos = (phase: AbilityPhase, abIndex: number, r: number, c: number) => {
    setDraftCard((prev) => {
      const nextAbilities = { ...prev.abilities };
      const currentAb = { ...nextAbilities[phase][abIndex] };
      const pos = currentAb.positions || [];
      const exists = pos.some(([pr, pc]) => pr === r && pc === c);
      currentAb.positions = exists
        ? pos.filter(([pr, pc]) => !(pr === r && pc === c))
        : [...pos, [r, c]];
      nextAbilities[phase] = [...nextAbilities[phase]];
      nextAbilities[phase][abIndex] = currentAb;
      return { ...prev, abilities: nextAbilities };
    });
  };

  const setAllGridPos = (phase: AbilityPhase, abIndex: number, targetGroup: 'enemy' | 'ally' | 'clear') => {
    setDraftCard((prev) => {
      const nextAbilities = { ...prev.abilities };
      const currentAb = { ...nextAbilities[phase][abIndex] };
      if (targetGroup === 'clear') {
        currentAb.positions = [];
      } else if (targetGroup === 'enemy') {
        currentAb.positions = [
          [0, 0], [0, 1], [0, 2],
          [1, 0], [1, 1], [1, 2],
          [2, 0], [2, 1], [2, 2],
        ];
      } else {
        currentAb.positions = [
          [3, 0], [3, 1], [3, 2],
          [4, 0], [4, 1], [4, 2],
          [5, 0], [5, 1], [5, 2],
        ];
      }
      nextAbilities[phase] = [...nextAbilities[phase]];
      nextAbilities[phase][abIndex] = currentAb;
      return { ...prev, abilities: nextAbilities };
    });
  };

  // Save Card
  const handleSaveCard = () => {
    const trimmedName = draftCard.name.trim() || 'کارت اساطیری';
    const cardToSave = { ...draftCard, name: trimmedName };
    const idx = cardLibrary.findIndex((c) => c.id === cardToSave.id);
    let updated: CardDef[];
    if (idx >= 0) {
      updated = [...cardLibrary];
      updated[idx] = cardToSave;
      showToast(`کارت ${cardToSave.name} به‌روزرسانی شد!`);
    } else {
      updated = [cardToSave, ...cardLibrary];
      showToast(`کارت ${cardToSave.name} به کالکشن ذخیره شد!`);
    }
    saveCards(updated);
    onUpdateCards(updated);
    sound.play('coin');
  };

  // Board Slot Click (Interactive 6x3 Board)
  const handleSlotClick = (r: number, c: number) => {
    const currentCard = editorBoard[r]?.[c];
    const newBoard = editorBoard.map((row) => [...row]);
    if (placingDef) {
      newBoard[r][c] = placingDef;
      sound.play('select');
    } else if (currentCard) {
      newBoard[r][c] = null;
      sound.play('click');
      showToast('کارت از این خانه حذف شد.');
    } else {
      newBoard[r][c] = draftCard;
      sound.play('select');
    }
    setEditorBoard(newBoard);
  };

  // Setups Actions
  const handleSaveSetup = () => {
    const name = setupNameInput.trim() || `چیدمان نبرد ${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
    const newSetup: SavedSetup = {
      id: 'setup_' + Date.now(),
      name,
      layout: editorBoard.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    };
    const updated = [newSetup, ...savedSetups.slice(0, 19)];
    setSavedSetups(updated);
    setSetupNameInput('');
    sound.play('coin');
    showToast(`چیدمان "${name}" ذخیره شد.`);
  };

  const handleLoadSetup = (s: SavedSetup) => {
    setEditorBoard(s.layout.map((row) => row.map((cell) => (cell ? { ...cell } : null))));
    sound.play('select');
    showToast(`چیدمان "${s.name}" بارگذاری شد.`);
  };

  const handleDeleteSetup = (id: string) => {
    setSavedSetups(savedSetups.filter((s) => s.id !== id));
    sound.play('death');
  };

  const handleClearBoard = () => {
    if (!confirm('آیا تمام خانه‌های صفحه نبرد خالی شوند؟')) return;
    setEditorBoard(Array.from({ length: 6 }, () => Array(3).fill(null)));
    sound.play('click');
    showToast('صفحه نبرد پاک شد.');
  };

  const handleResetDefaultBoard = () => {
    const b: (CardDef | null)[][] = Array.from({ length: 6 }, () => Array(3).fill(null));
    if (cardLibrary.length > 0) {
      b[0][0] = cardLibrary[2] || cardLibrary[0];
      b[0][1] = cardLibrary[0];
      b[0][2] = cardLibrary[2] || cardLibrary[0];
      b[1][0] = cardLibrary[3] || cardLibrary[0];
      b[1][1] = cardLibrary[1] || cardLibrary[0];
      b[1][2] = cardLibrary[3] || cardLibrary[0];
      b[4][0] = cardLibrary[3] || cardLibrary[0];
      b[4][1] = cardLibrary[1] || cardLibrary[0];
      b[4][2] = cardLibrary[3] || cardLibrary[0];
      b[5][0] = cardLibrary[2] || cardLibrary[0];
      b[5][1] = cardLibrary[0];
      b[5][2] = cardLibrary[2] || cardLibrary[0];
    }
    setEditorBoard(b);
    sound.play('victory');
    showToast('چیدمان پیش‌فرض بازنشانی شد.');
  };

  // Base64 Import & Export
  const handleExportCard = (c: CardDef) => {
    try {
      const json = JSON.stringify(c);
      const code = btoa(unescape(encodeURIComponent(json)));
      setCodeImportText(code);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          showToast('کد کارت در حافظه کلیپ‌بورد کپی شد!');
        }).catch(() => {
          showToast('کد کارت در کادر متنی زیر قرار گرفت.');
        });
      } else {
        showToast('کد کارت در کادر متنی زیر قرار گرفت.');
      }
    } catch {
      showToast('خطا در ایجاد کد کارت.');
    }
  };

  const handleImportCard = () => {
    if (!codeImportText.trim()) {
      showToast('ابتدا کد کارت را وارد کنید.');
      return;
    }
    try {
      const json = decodeURIComponent(escape(atob(codeImportText.trim())));
      const parsed = JSON.parse(json);
      if (!parsed || !parsed.name) throw new Error('invalid');

      const importedCard: CardDef = {
        ...parsed,
        id: 'hero_' + Date.now(),
        name: parsed.name + ' (وارد شده)',
      };
      const updated = [importedCard, ...cardLibrary];
      saveCards(updated);
      onUpdateCards(updated);
      setDraftCard(importedCard);
      setCodeImportText('');
      sound.play('victory');
      showToast(`کارت ${importedCard.name} با موفقیت وارد شد!`);
    } catch {
      showToast('کد کارت نامعتبر است.');
    }
  };

  const handleDuplicate = (c: CardDef) => {
    const dup: CardDef = {
      ...JSON.parse(JSON.stringify(c)),
      id: 'hero_' + Date.now(),
      name: c.name + ' (کپی)',
    };
    const updated = [dup, ...cardLibrary];
    saveCards(updated);
    onUpdateCards(updated);
    sound.play('select');
    showToast(`کپی از ${c.name} ایجاد شد.`);
  };

  const handleDeleteCard = (id: string, name: string) => {
    if (!confirm(`آیا از حذف کارت ${name} مطمئن هستید؟`)) return;
    const updated = cardLibrary.filter((c) => c.id !== id);
    saveCards(updated);
    onUpdateCards(updated);
    sound.play('death');
    showToast(`کارت ${name} حذف شد.`);
  };

  // Image Management Handlers
  const handleAddNewImageToLibrary = () => {
    const finalUrl = newImgData || newImgUrlInput.trim();
    if (!finalUrl) {
      alert('لطفاً یک عکس انتخاب کرده یا آدرس تصویر را وارد کنید.');
      return;
    }
    const name = newImgName.trim() || 'تصویر اساطیری';
    const newImage: GameAssetImage = {
      id: 'custom_img_' + Date.now(),
      name,
      url: finalUrl,
      category: newImgCategory,
      createdAt: Date.now(),
      isCustom: true,
    };
    addGameImage(newImage);
    setGameImages(loadGameImages());
    setNewImgName('');
    setNewImgData(null);
    setNewImgUrlInput('');
    sound.play('coin');
    showToast(`تصویر جدید "${name}" به گالری اضافه شد!`);
  };

  const handleStartEditImage = (img: GameAssetImage) => {
    sound.play('select');
    setEditingImage(img);
    setEditImgName(img.name);
    setEditImgCategory(img.category);
    setEditImgData(img.url.startsWith('data:') ? img.url : null);
    setEditImgUrlInput(img.url.startsWith('data:') ? '' : img.url);
  };

  const handleSaveEditImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;
    const finalUrl = editImgData || editImgUrlInput.trim() || editingImage.url;
    const updated: GameAssetImage = {
      ...editingImage,
      name: editImgName.trim() || editingImage.name,
      category: editImgCategory,
      url: finalUrl,
    };
    updateGameImage(updated);
    setGameImages(loadGameImages());
    sound.play('coin');
    showToast(`مشخصات تصویر "${updated.name}" به‌روزرسانی شد!`);
    setEditingImage(null);
  };

  const handleDeleteImageFromLibrary = (id: string, name: string) => {
    if (!confirm(`آیا از حذف تصویر "${name}" مطمئن هستید؟`)) return;
    deleteGameImage(id);
    setGameImages(loadGameImages());
    sound.play('death');
    showToast(`تصویر "${name}" با موفقیت حذف شد.`);
  };

  const handleResetDefaultImages = () => {
    if (!confirm('آیا گالری تصاویر به حالت پیش‌فرض بازگردد؟')) return;
    const restored = resetDefaultGameImages();
    setGameImages(restored);
    sound.play('victory');
    showToast('گالری تصاویر پیش‌فرض با موفقیت بازنشانی شد!');
  };

  const powerInfo = calculateCardPowerScore(draftCard);

  return (
    <div className="w-full flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto select-none bg-stone-950 text-stone-100 pb-24">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-500/40 pb-3 bg-stone-900/90 p-4 rounded-3xl border shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛠️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300">
                مرکز ادیتور همه‌جانبه بازی (کارت، گالری، صندوق و رویداد)
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                طراحی کارت‌های اساطیری، ویرایش صداها و پسیوها، مدیریت تصاویر و شبیه‌ساز تست دوئل
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sound.play('select');
                setShowArchetypeModal(true);
              }}
              className="bg-purple-900/80 hover:bg-purple-800 border border-purple-500/80 text-purple-200 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <span>📜</span>
              <span>الگوهای آماده</span>
            </button>
            <button
              onClick={() => {
                sound.play('select');
                setShowDuelModal(true);
              }}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 text-white text-xs font-black px-3 py-2 rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>⚔️</span>
              <span>شبیه‌ساز دوئل ۱v۱</span>
            </button>
            <button
              onClick={() => {
                sound.play('click');
                setDraftCard(createFreshCard());
                showToast('کارت جدید آماده شد.');
              }}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold px-3 py-2 rounded-xl border border-stone-700 transition cursor-pointer"
            >
              کارت جدید 🆕
            </button>
            <button
              onClick={handleSaveCard}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              ذخیره کارت 💾
            </button>
            {onTestBattle && (
              <button
                onClick={() => onTestBattle(draftCard)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
              >
                تست در میدان نبرد ⚔️
              </button>
            )}
          </div>
        </div>

        {statusNotice && (
          <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs p-3 rounded-2xl text-center shadow animate-in fade-in font-bold">
            {statusNotice}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 shadow">
          <button
            onClick={() => {
              sound.play('click');
              setEditorTab('card');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              editorTab === 'card'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <span>🃏</span>
            <span>ادیتور کارت و پسیوها</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setGameImages(loadGameImages());
              setEditorTab('images');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              editorTab === 'images'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <span>🖼️</span>
            <span>مدیریت و ویرایش تصاویر</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setEditorTab('chests');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              editorTab === 'chests'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <span>📦</span>
            <span>تنظیمات شانس صندوق‌ها</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setEditorTab('events');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              editorTab === 'events'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <span>🏆</span>
            <span>طراحی مسابقات</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setEditorTab('auth');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              editorTab === 'auth'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <span>🔐</span>
            <span>ورود و ثبت‌نام</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setEditorTab('usd');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              editorTab === 'usd'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <span>💵</span>
            <span>معاملات دلاری و چت</span>
          </button>
        </div>

        {editorTab === 'card' && (
          <div className="flex flex-col gap-5">
            {/* Interactive 6x3 Battle Board */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                <div>
                  <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>🗺️</span>
                    <span>تخته شبیه‌سازی ۶×۳ (کلیک روی خانه‌ها برای چیدمان کارت)</span>
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    بالا = دشمنان | پایین = یاران شما | کلیک دوباره روی کارت = حذف از خانه
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDefaultBoard}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer"
                  >
                    چیدمان پیش‌فرض 🔄
                  </button>
                  <button
                    onClick={handleClearBoard}
                    className="bg-stone-800 hover:bg-stone-700 text-rose-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer"
                  >
                    پاک کردن تخته 🧹
                  </button>
                </div>
              </div>

              {placingDef && (
                <div
                  onClick={() => {
                    setPlacingDef(null);
                    showToast('حالت چیدمان به پایان رسید.');
                  }}
                  className="bg-amber-500 text-stone-950 font-black text-xs p-2.5 rounded-xl text-center shadow-lg animate-pulse cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>📍</span>
                  <span>در حال چیدمان کارت: {placingDef.name} (روی خانه‌ها بزنید - برای اتمام اینجا را لمس کنید)</span>
                </div>
              )}

              {/* 6x3 Visual Grid */}
              <div className="bg-stone-950/80 p-3 sm:p-4 rounded-2xl border border-stone-800 flex flex-col gap-2 items-center">
                <span className="text-[10px] text-rose-400/80 font-bold tracking-widest uppercase">
                  ⚔️ سمت دشمن
                </span>
                {[0, 1, 2].map((r) => (
                  <div key={`erow-${r}`} className="flex gap-2 sm:gap-3">
                    {[0, 1, 2].map((c) => {
                      const card = editorBoard[r]?.[c];
                      return (
                        <div
                          key={`eb-slot-${r}-${c}`}
                          onClick={() => handleSlotClick(r, c)}
                          className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl bg-black/40 border-2 border-dashed border-rose-900/60 hover:border-amber-400 flex items-center justify-center relative shadow-inner cursor-pointer transition"
                        >
                          {card ? (
                            <CardView card={card} compact />
                          ) : (
                            <span className="text-stone-600 text-xs font-bold">+</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                <div className="w-full max-w-sm h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent my-1" />

                <span className="text-[10px] text-emerald-400/80 font-bold tracking-widest uppercase">
                  🛡️ سمت یاران شما
                </span>
                {[3, 4, 5].map((r) => (
                  <div key={`prow-${r}`} className="flex gap-2 sm:gap-3">
                    {[0, 1, 2].map((c) => {
                      const card = editorBoard[r]?.[c];
                      return (
                        <div
                          key={`eb-slot-${r}-${c}`}
                          onClick={() => handleSlotClick(r, c)}
                          className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl bg-black/40 border-2 border-dashed border-emerald-900/60 hover:border-amber-400 flex items-center justify-center relative shadow-inner cursor-pointer transition"
                        >
                          {card ? (
                            <CardView card={card} compact />
                          ) : (
                            <span className="text-stone-600 text-xs font-bold">+</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 1: CARD SPECS & PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 flex flex-col items-center justify-between gap-3 shadow-xl">
                <div className="w-full text-center border-b border-stone-800 pb-2">
                  <span className="text-xs font-black text-amber-300">پیش‌نمایش زنده کارت</span>
                </div>
                <div className="py-3 transform scale-110 sm:scale-125">
                  <CardView card={draftCard} />
                </div>
                <div className="w-full bg-stone-950/80 rounded-2xl p-2.5 border border-stone-800 text-[11px] space-y-1 text-center">
                  <div className="text-amber-300 font-bold">
                    ارزش پیشنهادی در فروشگاه: {draftCard.shopPrice || 350} سکه
                  </div>
                  <div className="text-stone-400">
                    رده: <b className="text-stone-200">{draftCard.tier}</b> | نوع: <b className="text-stone-200">{draftCard.type}</b>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs sm:text-sm font-black text-amber-300 border-b border-stone-800 pb-2 flex items-center gap-1.5">
                  <span>📋</span>
                  <span>مشخصات و آمار اصلی کارت</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-stone-300 font-bold block mb-1">نام کارت:</label>
                    <input
                      type="text"
                      maxLength={25}
                      value={draftCard.name}
                      onChange={(e) => setDraftCard({ ...draftCard, name: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">قیمت خرید در فروشگاه (سکه):</label>
                    <input
                      type="number"
                      min={10}
                      step={50}
                      value={draftCard.shopPrice || 350}
                      onChange={(e) =>
                        setDraftCard({ ...draftCard, shopPrice: parseInt(e.target.value) || 50 })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-amber-300 font-black focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">نوع و کلاس کارت:</label>
                    <select
                      value={draftCard.type}
                      onChange={(e) => setDraftCard({ ...draftCard, type: e.target.value as CardType })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label} ({t.desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">رده کیفی (Tier):</label>
                    <select
                      value={draftCard.tier}
                      onChange={(e) => setDraftCard({ ...draftCard, tier: e.target.value as CardTier })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                    >
                      {TIER_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 text-[10px] text-amber-400/90 bg-amber-950/40 p-2 rounded-xl border border-amber-500/30">
                    💡 پاسدار جلوی ردیف عقب را می‌گیرد | افسون در شروع اجرا و مصرف می‌شود | خداگونه مصون از نابودی، یخ، زهر، آتش، سکوت و کاهش قدرت است.
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">قدرت حمله ⚔️:</label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={draftCard.attack}
                      onChange={(e) =>
                        setDraftCard({
                          ...draftCard,
                          attack: Math.max(0, Math.min(99, parseInt(e.target.value) || 0)),
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-rose-400 font-black focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">سلامتی و جان ❤️:</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={draftCard.health}
                      onChange={(e) =>
                        setDraftCard({
                          ...draftCard,
                          health: Math.max(1, Math.min(99, parseInt(e.target.value) || 1)),
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-emerald-400 font-black focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">ایموجی نماد کارت:</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={draftCard.icon || ''}
                      onChange={(e) => setDraftCard({ ...draftCard, icon: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">رنگ دور کارت 🎨:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftCard.borderColor || '#ffb300'}
                        onChange={(e) => setDraftCard({ ...draftCard, borderColor: e.target.value })}
                        className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                          <div
                            key={c}
                            onClick={() => setDraftCard({ ...draftCard, borderColor: c })}
                            style={{ backgroundColor: c }}
                            className="w-5 h-5 rounded-full border border-stone-700 cursor-pointer hover:scale-110 transition shadow"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">هاله نورانی (Aura) دور کارت:</label>
                    <select
                      value={draftCard.aura || 'none'}
                      onChange={(e) => setDraftCard({ ...draftCard, aura: e.target.value as any })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                    >
                      {AURA_OPTIONS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} ({a.desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-stone-300 font-bold block mb-1">داستان و روایت کارت (Lore / توضیحات):</label>
                    <textarea
                      rows={2}
                      maxLength={200}
                      value={draftCard.description || ''}
                      onChange={(e) => setDraftCard({ ...draftCard, description: e.target.value })}
                      placeholder="توضیحات حماسی درباره این قهرمان..."
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-amber-400 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-2.5 pt-2 border-t border-stone-800">
                    <label className="text-amber-300 font-bold block">عکس و تمثال اختصاصی کارت:</label>
                    
                    {/* Presets Gallery */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 bg-stone-950 p-2.5 rounded-2xl border border-stone-800">
                      {[
                        { id: 'rostam', name: 'رستم', url: GAME_VISUALS.rostamHero },
                        { id: 'sohrab', name: 'سهراب', url: GAME_VISUALS.sohrabHero },
                        { id: 'arash', name: 'آرش', url: GAME_VISUALS.arashArcher },
                        { id: 'tahmineh', name: 'تهمینه', url: GAME_VISUALS.tahminehAvatar },
                        { id: 'kaveh', name: 'کاوه', url: GAME_VISUALS.kavehBlacksmith },
                        { id: 'simurgh', name: 'سیمرغ', url: GAME_VISUALS.simurghBird },
                        { id: 'div', name: 'دیو سپید', url: GAME_VISUALS.demonKing },
                        { id: 'zahak', name: 'ضحاک', url: GAME_VISUALS.zahakVillain },
                      ].map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setDraftCard({ ...draftCard, image: preset.url });
                            sound.play('select');
                          }}
                          className={`p-1 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                            draftCard.image === preset.url
                              ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50'
                              : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-9 h-9 object-cover rounded-lg" />
                          <span className="text-[9px] font-bold text-stone-300 truncate w-full text-center">{preset.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={draftCard.image && !draftCard.image.startsWith('data:') ? draftCard.image : ''}
                        onChange={(e) => setDraftCard({ ...draftCard, image: e.target.value.trim() || null })}
                        placeholder="یا آدرس مستقیم اینترنتی تصویر را وارد کنید..."
                        className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                      />
                      <label className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow">
                        آپلود فایل 📁
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {draftCard.image && (
                        <button
                          type="button"
                          onClick={() => setDraftCard({ ...draftCard, image: null })}
                          className="bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                        >
                          حذف عکس ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CARD SOUNDS */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <span>🔊</span>
                  <span>صداهای اختصاصی کارت در میدان رزم</span>
                </h3>
                <span className="text-[10px] text-stone-400">پشتیبانی از آپلود فایل صوتی یا انتخاب صداهای بازی</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'start' as const, label: '🌟 صدای ورود به بازی:', desc: 'هنگام چیده شدن و شروع نبرد پخش می‌شود' },
                  { id: 'attack' as const, label: '⚔️ صدای ضربه و حمله:', desc: 'هنگام ضربه زدن به کارت‌های دشمن پخش می‌شود' },
                  { id: 'death' as const, label: '💀 صدای نابودی و مرگ:', desc: 'هنگام رسیدن جان به صفر و مرگ پخش می‌شود' },
                ].map((snd) => {
                  const hasSound = !!draftCard.sounds?.[snd.id];
                  return (
                    <div
                      key={snd.id}
                      className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3 flex flex-col justify-between gap-2 shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-300">{snd.label}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-black ${
                              hasSound ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-stone-500'
                            }`}
                          >
                            {hasSound ? 'دارد ✓' : 'بدون صدا'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5">{snd.desc}</p>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-stone-800/80">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleAudioUpload(snd.id, e)}
                          className="text-[10px] text-stone-400 w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSoundModalFor(snd.id)}
                          className="w-full bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-[10px] font-bold py-1 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>🎵</span>
                          <span>انتخاب از صداهای آماده بازی</span>
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handlePlayCardSound(snd.id)}
                            disabled={!hasSound}
                            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-stone-950 font-black text-xs py-1 rounded-lg shadow transition cursor-pointer"
                          >
                            تست صدا ▶️
                          </button>
                          <button
                            onClick={() => handleRemoveAudio(snd.id)}
                            disabled={!hasSound}
                            className="bg-rose-950 hover:bg-rose-900 border border-rose-600 disabled:opacity-30 text-rose-300 text-xs px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            حذف 🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: PASSIVE ABILITIES */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>ویژگی‌های پسیو و همیشگی کارت (۱۱ نوع قابلیت پسیو)</span>
                </h3>
                <span className="text-[10px] text-stone-400">قابلیت‌هایی که به صورت خودکار در طول نبرد فعال هستند</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {PASSIVE_DEFS.map((p) => {
                  const active = p.hasAmount
                    ? typeof draftCard.passives?.[p.key] === 'number' &&
                      (draftCard.passives[p.key] as number) > 0
                    : !!draftCard.passives?.[p.key];

                  const currentVal =
                    typeof draftCard.passives?.[p.key] === 'number'
                      ? (draftCard.passives[p.key] as number)
                      : p.def || 0;

                  return (
                    <div
                      key={p.key}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs transition ${
                        active
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow'
                          : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <button
                        onClick={() => togglePassive(p)}
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                      {p.hasAmount && active && (
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={currentVal}
                          onChange={(e) =>
                            handlePassiveAmountChange(p.key, parseInt(e.target.value) || 0)
                          }
                          className="w-12 bg-stone-900 border border-amber-500/60 rounded px-1 text-center font-bold text-amber-300 text-xs"
                          title={p.unit}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active Passives Description Box */}
              <div className="bg-stone-950/80 p-3 rounded-2xl border border-stone-800 text-xs leading-relaxed space-y-1">
                <span className="text-amber-300 font-bold block mb-1">راهنما و پسیوهای فعال این کارت:</span>
                {PASSIVE_DEFS.filter((d) => draftCard.passives?.[d.key]).length === 0 ? (
                  <p className="text-stone-500 text-[11px] italic">روی دکمه‌های بالا بزنید تا ویژگی‌های پسیو فعال شوند.</p>
                ) : (
                  PASSIVE_DEFS.filter((d) => draftCard.passives?.[d.key]).map((d) => (
                    <div key={d.key} className="text-stone-300 text-[11px] flex items-center gap-1.5">
                      <span>{d.icon}</span>
                      <b>{d.label}:</b>
                      <span>{d.desc}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 4: THE 6 PHASES OF ABILITIES */}
            {(Object.keys(PHASE_LABELS) as AbilityPhase[]).map((phase) => {
              const abilities = draftCard.abilities[phase] || [];
              const availableActions = ABILITY_DEFS[phase];

              return (
                <div
                  key={phase}
                  className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                      <span>{PHASE_LABELS[phase]}</span>
                    </h3>
                    <span className="text-[10px] text-stone-400">
                      {abilities.length > 0 ? `${abilities.length} قابلیت فعال` : 'بدون قابلیت'}
                    </span>
                  </div>

                  {/* Add action buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {availableActions.map((opt) => (
                      <button
                        key={opt.action}
                        onClick={() => handleAddAbility(phase, opt)}
                        className="bg-stone-950 hover:bg-stone-800 border border-stone-700 hover:border-amber-400 text-stone-200 text-xs px-2.5 py-1 rounded-xl transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                      >
                        <span>+ {opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Configured abilities list */}
                  <div className="flex flex-col gap-3 mt-1">
                    {abilities.map((ab, idx) => {
                      const meta = ACTION_META[ab.action] || {};
                      return (
                        <div
                          key={ab.id || idx}
                          className="bg-stone-950/90 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col gap-3 shadow"
                        >
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <div className="flex items-center gap-2 font-black text-amber-300 text-xs sm:text-sm">
                              <span className="text-base">{ab.icon}</span>
                              <span>{ab.label}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveAbility(phase, idx)}
                              className="bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs px-2.5 py-1 rounded-xl font-bold transition cursor-pointer"
                            >
                              حذف 🗑
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs">
                            {!meta.noAmount && (
                              <div className="flex items-center gap-1.5">
                                <label className="text-stone-400 font-bold">{meta.unit || 'مقدار'}:</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={99}
                                  value={ab.amount}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setDraftCard((prev) => {
                                      const nextAb = { ...prev.abilities };
                                      nextAb[phase][idx].amount = val;
                                      return { ...prev, abilities: nextAb };
                                    });
                                  }}
                                  className="w-16 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-center text-amber-300 font-bold"
                                />
                              </div>
                            )}

                            {meta.auto ? (
                              <div className="text-[11px] text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-800">
                                🎯 هدف خودکار: {ab.action === 'counterAttack' ? 'مهاجم' : 'خود کارت'}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <label className="text-stone-400 font-bold">سمت هدف:</label>
                                <select
                                  value={ab.targetSide}
                                  onChange={(e) => {
                                    const side = e.target.value as 'ally' | 'enemy';
                                    setDraftCard((prev) => {
                                      const nextAb = { ...prev.abilities };
                                      nextAb[phase][idx].targetSide = side;
                                      return { ...prev, abilities: nextAb };
                                    });
                                  }}
                                  className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 font-bold"
                                >
                                  <option value="enemy">دشمنان</option>
                                  <option value="ally">یاران خودی</option>
                                </select>
                              </div>
                            )}

                            {!meta.auto && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <label className="text-stone-400 font-bold">معیار انتخاب هدف:</label>
                                  <select
                                    value={ab.targetCriteria || 'all'}
                                    onChange={(e) => {
                                      const crit = e.target.value as any;
                                      setDraftCard((prev) => {
                                        const nextAb = { ...prev.abilities };
                                        nextAb[phase][idx].targetCriteria = crit;
                                        return { ...prev, abilities: nextAb };
                                      });
                                    }}
                                    className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 font-bold"
                                  >
                                    {TARGET_CRITERIA_OPTIONS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <label className="text-stone-400 font-bold">شانس اعمال (%):</label>
                                  <input
                                    type="number"
                                    min={10}
                                    max={100}
                                    step={10}
                                    value={ab.chancePercent || 100}
                                    onChange={(e) => {
                                      const val = Math.max(10, Math.min(100, parseInt(e.target.value) || 100));
                                      setDraftCard((prev) => {
                                        const nextAb = { ...prev.abilities };
                                        nextAb[phase][idx].chancePercent = val;
                                        return { ...prev, abilities: nextAb };
                                      });
                                    }}
                                    className="w-16 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-center text-amber-300 font-bold"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* 6x3 Position Grid for Targets */}
                          {!meta.auto && (
                            <div className="bg-stone-900/80 p-2.5 rounded-2xl border border-stone-800 flex flex-col items-center gap-2">
                              <div className="flex justify-between items-center w-full px-1">
                                <span className="text-[11px] text-stone-400 font-bold">
                                  خانه‌های فعال هدف (لمس برای انتخاب/عدم‌انتخاب):
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => setAllGridPos(phase, idx, 'enemy')}
                                    className="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer"
                                  >
                                    همه دشمنان
                                  </button>
                                  <button
                                    onClick={() => setAllGridPos(phase, idx, 'ally')}
                                    className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer"
                                  >
                                    همه خودی‌ها
                                  </button>
                                  <button
                                    onClick={() => setAllGridPos(phase, idx, 'clear')}
                                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer"
                                  >
                                    پاک کردن
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 my-1">
                                {[0, 1, 2, 3, 4, 5].map((r) => (
                                  <div key={`ab-g-row-${r}`} className="flex gap-1.5">
                                    {[0, 1, 2].map((c) => {
                                      const isActive = ab.positions?.some(([pr, pc]) => pr === r && pc === c);
                                      const isEnemySide = r < 3;
                                      return (
                                        <button
                                          key={`ab-g-cell-${r}-${c}`}
                                          onClick={() => toggleGridPos(phase, idx, r, c)}
                                          className={`w-9 h-7 rounded border transition text-[10px] font-bold cursor-pointer ${
                                            isActive
                                              ? 'bg-amber-500 border-amber-300 text-stone-950 ring-2 ring-amber-400 shadow'
                                              : isEnemySide
                                              ? 'bg-rose-950/40 border-rose-900/60 text-rose-300 hover:bg-rose-900/50'
                                              : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300 hover:bg-emerald-900/50'
                                          }`}
                                          title={`ردیف ${r + 1} - ستون ${c + 1}`}
                                        >
                                          {isActive ? '✓' : ''}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* SECTION 5: SAVED SETUPS */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <span>🗂️</span>
                  <span>چیدمان‌ها و استراتژی‌های ذخیره‌شده نبرد ({savedSetups.length} چیدمان)</span>
                </h3>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="نام چیدمان جدید..."
                  value={setupNameInput}
                  onChange={(e) => setSetupNameInput(e.target.value)}
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
                <button
                  onClick={handleSaveSetup}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-4 py-2 rounded-xl shadow transition cursor-pointer"
                >
                  ذخیره وضعیت صفحه 💾
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {savedSetups.length === 0 ? (
                  <div className="text-stone-500 text-xs text-center py-4 bg-stone-950/50 rounded-2xl border border-stone-800">
                    هنوز چیدمانی ذخیره نشده است.
                  </div>
                ) : (
                  savedSetups.map((s) => (
                    <div
                      key={s.id}
                      className="bg-stone-950 border border-stone-800 hover:border-amber-500/60 p-3 rounded-2xl flex items-center justify-between shadow"
                    >
                      <span className="font-bold text-xs text-amber-200">🗂️ {s.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadSetup(s)}
                          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl shadow cursor-pointer"
                        >
                          بارگذاری روی تخته 📥
                        </button>
                        <button
                          onClick={() => handleDeleteSetup(s.id)}
                          className="bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer"
                        >
                          حذف 🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 6: CARD LIBRARY & CODE EXCHANGE */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>📚</span>
                    <span>کتابخانه جامع کارت‌های بازی ({cardLibrary.length} کارت)</span>
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    ویرایش، تکثیر، صدور کد و حذف کارت‌ها از پایگاه داده بازی
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportAllCardsJson}
                    className="bg-stone-800 hover:bg-stone-700 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>📤</span>
                    <span>صدور کل به JSON</span>
                  </button>
                  <label className="bg-stone-800 hover:bg-stone-700 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer flex items-center gap-1">
                    <span>📥</span>
                    <span>ورود از JSON</span>
                    <input type="file" accept=".json" onChange={handleImportAllCardsJson} className="hidden" />
                  </label>
                  <button
                    onClick={handleResetToMythicalCards}
                    className="bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>🔄</span>
                    <span>بازنشانی به کارت‌های شاهنامه</span>
                  </button>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-stone-950 p-3 rounded-2xl border border-stone-800 text-xs">
                <input
                  type="text"
                  placeholder="جستجوی نام کارت..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-amber-400 focus:outline-none"
                />
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 font-bold"
                >
                  <option value="all">همه رده‌ها (Tiers)</option>
                  <option value="normal">عادی</option>
                  <option value="medium">متوسط</option>
                  <option value="legendary">افسانه‌ای</option>
                  <option value="god">خداگونه (God)</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 font-bold"
                >
                  <option value="all">همه انواع</option>
                  <option value="attacker">تازشگر</option>
                  <option value="defender">پاسدار</option>
                  <option value="mage">افسونگر</option>
                  <option value="king">پادشاه</option>
                  <option value="spell">افسون</option>
                  <option value="god">خدا</option>
                  <option value="both">دوطرفه</option>
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {cardLibrary
                  .filter((c) => {
                    if (filterTier !== 'all' && c.tier !== filterTier) return false;
                    if (filterType !== 'all' && c.type !== filterType) return false;
                    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                      return false;
                    return true;
                  })
                  .map((c) => (
                  <div
                    key={c.id}
                    className="bg-stone-950/90 border border-stone-800 hover:border-amber-500/60 rounded-2xl p-2.5 flex flex-col items-center justify-between gap-2 shadow"
                  >
                    <CardView card={c} compact />
                    <span className="text-[10px] font-bold text-stone-200 text-center truncate max-w-full">
                      {c.name}
                    </span>
                    <div className="grid grid-cols-2 gap-1 w-full pt-1 border-t border-stone-800">
                      <button
                        onClick={() => {
                          setDraftCard(JSON.parse(JSON.stringify(c)));
                          sound.play('select');
                          showToast(`کارت ${c.name} در ادیتور باز شد.`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-black py-1 rounded shadow cursor-pointer"
                        title="ویرایش در فرم"
                      >
                        ویرایش ✏️
                      </button>
                      <button
                        onClick={() => {
                          setPlacingDef(c);
                          sound.play('select');
                          showToast(`کارت ${c.name} برای چیدمان انتخاب شد.`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold py-1 rounded cursor-pointer"
                        title="چیدمان روی تخته"
                      >
                        چیدمان 📍
                      </button>
                      <button
                        onClick={() => handleDuplicate(c)}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold py-1 rounded cursor-pointer"
                        title="کپی"
                      >
                        کپی 📋
                      </button>
                      <button
                        onClick={() => handleExportCard(c)}
                        className="bg-stone-800 hover:bg-stone-700 text-cyan-300 text-[10px] font-bold py-1 rounded cursor-pointer"
                        title="کد تبادل"
                      >
                        کد 📤
                      </button>
                      <button
                        onClick={() => handleDeleteCard(c.id, c.name)}
                        className="col-span-2 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 text-[10px] font-bold py-1 rounded cursor-pointer"
                        title="حذف"
                      >
                        حذف 🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Code Exchange Box */}
              <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-amber-300">
                  تبادل کارت با کد رمزنگاری‌شده Base64:
                </span>
                <textarea
                  rows={2}
                  value={codeImportText}
                  onChange={(e) => setCodeImportText(e.target.value)}
                  placeholder="کد کارت را اینجا وارد کرده یا برای اشتراک‌گذاری کپی کنید..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs font-mono text-cyan-300 focus:outline-none"
                  dir="ltr"
                />
                <button
                  onClick={handleImportCard}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs py-2 px-5 rounded-xl shadow transition self-end cursor-pointer"
                >
                  وارد کردن کارت از کد 📥
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Images & Avatars Manager with Edit & Delete */}
        {editorTab === 'images' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/95 border-2 border-purple-500/70 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-sm sm:text-base font-black text-purple-300">
                  آپلود و طراحی تصویر جدید برای کارت‌ها و آواتارها 🖼️
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 flex flex-col gap-3 text-xs">
                  <div>
                    <label className="text-stone-300 font-bold block mb-1">نام یا عنوان تصویر:</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={newImgName}
                      onChange={(e) => setNewImgName(e.target.value)}
                      placeholder="مثلاً: رستم دستان زره‌دار"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-stone-300 font-bold block mb-1">دسته‌بندی:</label>
                    <select
                      value={newImgCategory}
                      onChange={(e) => setNewImgCategory(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold focus:border-purple-400 focus:outline-none"
                    >
                      <option value="heroes">پهلوانان و جنگجویان</option>
                      <option value="kings">پادشاهان و فرمانروایان</option>
                      <option value="mages">افسونگران و خردمندان</option>
                      <option value="creatures">دیوان و موجودات اساطیری</option>
                      <option value="custom">سایر تصاویر اختصاصی</option>
                    </select>
                  </div>

                  <div className="border border-stone-800 rounded-2xl p-3 bg-stone-950/60 flex flex-col gap-2">
                    <span className="font-bold text-stone-300">انتخاب فایل تصویر از دستگاه:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
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
                              setNewImgData(cv.toDataURL('image/jpeg', 0.85));
                              setNewImgUrlInput('');
                              sound.play('select');
                            }
                          };
                          img.src = ev.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="text-xs text-stone-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-700 file:text-white cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleAddNewImageToLibrary}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs py-3 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    افزودن به گالری تصاویر 💾
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-stone-950 rounded-2xl border border-stone-800 text-center gap-3">
                  <span className="text-xs text-purple-300 font-bold">پیش‌نمایش تصویر جدید</span>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-purple-500/80 overflow-hidden flex items-center justify-center bg-stone-900 shadow-xl">
                    {newImgData || newImgUrlInput ? (
                      <img
                        src={newImgData || newImgUrlInput}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-stone-600">🖼️</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Images Gallery */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🖼️</span>
                  <div>
                    <h3 className="text-sm font-black text-amber-300">
                      گالری تصاویر و آواتارها ({gameImages.length} تصویر)
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      می‌توانید هر تصویری را ویرایش، روی کارت فعلی اعمال یا حذف کنید
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDefaultImages}
                    className="bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer"
                  >
                    بازنشانی تصاویر پیش‌فرض 🔄
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {[
                  { id: 'all', label: 'همه تصاویر' },
                  { id: 'heroes', label: 'پهلوانان' },
                  { id: 'kings', label: 'شاهان' },
                  { id: 'mages', label: 'افسونگران' },
                  { id: 'creatures', label: 'دیوان' },
                  { id: 'custom', label: 'اختصاصی' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setImageFilterCat(f.id)}
                    className={`px-3 py-1 rounded-xl font-bold transition border cursor-pointer ${
                      imageFilterCat === f.id
                        ? 'bg-purple-600 text-white border-purple-400 shadow'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {gameImages
                  .filter((img) => imageFilterCat === 'all' || img.category === imageFilterCat)
                  .map((img) => {
                    const catLabel =
                      img.category === 'heroes' ? 'پهلوان' :
                      img.category === 'kings' ? 'پادشاه' :
                      img.category === 'mages' ? 'افسونگر' :
                      img.category === 'creatures' ? 'دیو / موجود' : 'اختصاصی';

                    return (
                      <div
                        key={img.id}
                        className="bg-stone-950/80 border border-stone-800 hover:border-purple-500/60 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 shadow group transition"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/60 bg-stone-900 flex items-center justify-center shadow">
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center w-full">
                          <span className="text-[11px] font-bold text-stone-200 block truncate">
                            {img.name}
                          </span>
                          <span className="text-[9px] bg-stone-900 text-purple-300 px-1.5 py-0.2 rounded border border-stone-800">
                            {catLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 w-full pt-1.5 border-t border-stone-800/80">
                          <button
                            onClick={() => {
                              setDraftCard((prev) => ({ ...prev, image: img.url }));
                              sound.play('coin');
                              showToast(`تصویر ${img.name} برای کارت انتخاب شد.`);
                            }}
                            className="col-span-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-black py-1 rounded-lg transition cursor-pointer"
                          >
                            انتخاب برای کارت 👈
                          </button>
                          <button
                            onClick={() => handleStartEditImage(img)}
                            className="bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-200 text-[10px] font-bold py-1 rounded-lg transition cursor-pointer"
                          >
                            ویرایش ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteImageFromLibrary(img.id, img.name)}
                            className="bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 text-[10px] font-bold py-1 rounded-lg transition cursor-pointer"
                          >
                            حذف 🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* MODAL: EDIT IMAGE */}
            {editingImage && (
              <div
                onClick={() => setEditingImage(null)}
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg bg-stone-900 border-2 border-purple-500 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <h3 className="text-base font-black text-purple-300">
                      ویرایش مشخصات تصویر: {editingImage.name}
                    </h3>
                    <button
                      onClick={() => setEditingImage(null)}
                      className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditImage} className="flex flex-col gap-3.5 text-xs">
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-400 bg-stone-900 flex items-center justify-center shrink-0 shadow-lg">
                        <img
                          src={editImgData || editImgUrlInput.trim() || editingImage.url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <div>
                          <label className="text-stone-300 font-bold block mb-1">نام تصویر:</label>
                          <input
                            type="text"
                            required
                            maxLength={30}
                            value={editImgName}
                            onChange={(e) => setEditImgName(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-stone-300 font-bold block mb-1">دسته‌بندی:</label>
                          <select
                            value={editImgCategory}
                            onChange={(e) => setEditImgCategory(e.target.value as any)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold"
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

                    <div className="flex gap-2 pt-2 border-t border-stone-800">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black py-2.5 rounded-xl shadow-lg transition cursor-pointer"
                      >
                        ذخیره تغییرات 💾
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingImage(null)}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Mystery Chests Editor */}
        {editorTab === 'chests' && (
          <div className="animate-in fade-in duration-200">
            <ChestEditorScreen cardLibrary={cardLibrary} />
          </div>
        )}

        {/* Tab 4: Events Editor */}
        {editorTab === 'events' && (
          <div className="animate-in fade-in duration-200">
            <EventEditorScreen cardLibrary={cardLibrary} />
          </div>
        )}

        {/* Tab 5: Auth Portal Editor */}
        {editorTab === 'auth' && (
          <div className="animate-in fade-in duration-200">
            <AuthEditorSection />
          </div>
        )}

        {/* Tab 6: USD Finance & User Chat Manager */}
        {editorTab === 'usd' && (
          <div className="animate-in fade-in duration-200">
            <UsdAdminFinancePanel currentUser={user || undefined} />
          </div>
        )}

        {/* MODAL 1: CARD DUEL SIMULATOR (1v1 BATTLE TEST ARENA) */}
        {showDuelModal && (
          <CardDuelSimulator
            playerCard={draftCard}
            cardLibrary={cardLibrary}
            onClose={() => setShowDuelModal(false)}
          />
        )}

        {/* MODAL 2: ARCHETYPE TEMPLATES PICKER */}
        {showArchetypeModal && (
          <div
            onClick={() => setShowArchetypeModal(false)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-stone-900 border-2 border-purple-500 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📜</span>
                  <div>
                    <h3 className="text-base font-black text-purple-300">
                      الگوها و کهن‌الگوهای آماده اساطیر شاهنامه
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      یک کهن‌الگو را انتخاب کنید تا تمام آمارها، پسیوها و قابلیت‌های هماهنگ روی کارت بارگذاری شوند
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowArchetypeModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {CARD_ARCHETYPES.map((arch, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-950 border border-stone-800 hover:border-purple-500/80 rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{arch.icon}</span>
                        <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-800 font-bold">
                          {arch.badge}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-amber-200 mt-2">{arch.name}</h4>
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {arch.description}
                      </p>
                      <div className="flex gap-3 text-xs font-black mt-2 pt-2 border-t border-stone-800/80">
                        <span className="text-rose-400">حمله: {arch.attack}</span>
                        <span className="text-emerald-400">جان: {arch.health}</span>
                        <span className="text-amber-400">💰 {arch.shopPrice}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyArchetype(arch)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs py-2 rounded-xl shadow transition active:scale-95 cursor-pointer mt-1"
                    >
                      اعمال این الگو 👈
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: SOUND PRESET SELECTOR */}
        {showSoundModalFor && (
          <div
            onClick={() => setShowSoundModalFor(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-stone-900 border-2 border-amber-500 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔊</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-amber-300">
                      انتخاب افکت صوتی برای{' '}
                      {showSoundModalFor === 'start'
                        ? 'شروع بازی'
                        : showSoundModalFor === 'attack'
                        ? 'حمله کارت'
                        : 'مرگ و نابودی'}
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      روی دکمه تست بزنید تا صدا پخش شود، سپس انتخاب کنید
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSoundModalFor(null)}
                  className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {SOUND_PRESETS.map((snd) => (
                  <div
                    key={snd.id}
                    className="bg-stone-950 border border-stone-800 hover:border-amber-500/60 p-2.5 rounded-xl flex items-center justify-between shadow"
                  >
                    <div className="flex items-center gap-2">
                      <span>{snd.icon}</span>
                      <span className="font-bold text-stone-200">{snd.label}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => sound.play(snd.id)}
                        className="bg-stone-800 hover:bg-stone-700 text-amber-300 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
                        title="پخش آزمایشی"
                      >
                        ▶️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectSoundPreset(showSoundModalFor, snd.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-2.5 py-1 rounded text-[11px] font-black cursor-pointer shadow"
                      >
                        انتخاب
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
