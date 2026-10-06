import { CardDef, CardType, CardTier, CardPassives } from '../types/game';
import { defaultPassives } from '../services/storage';

export interface CardArchetype {
  name: string;
  badge: string;
  icon: string;
  type: CardType;
  tier: CardTier;
  attack: number;
  health: number;
  borderColor: string;
  aura?: 'none' | 'fire' | 'magic' | 'gold' | 'ice' | 'lightning';
  shopPrice: number;
  description: string;
  passives: CardPassives;
  abilities: CardDef['abilities'];
}

export const CARD_ARCHETYPES: CardArchetype[] = [
  {
    name: 'یل سیستان (رستم‌تبار)',
    badge: 'جهان‌پهلوان تهاجمی',
    icon: '🦁',
    type: 'attacker',
    tier: 'legendary',
    attack: 35,
    health: 55,
    borderColor: '#ffd700',
    aura: 'fire',
    shopPrice: 1500,
    description: 'جنگجوی سنگین با ضربات برشی و خشم نبرد که با هر ضربه قوی‌تر می‌شود.',
    passives: { ...defaultPassives(), berserk: 4, cleave: true },
    abilities: {
      onStart: [],
      onTurnStart: [],
      onAttack: [
        {
          id: 'ab_rostam_1',
          action: 'damage',
          label: 'گرز گاوسار',
          icon: '🔨',
          amount: 8,
          targetSide: 'enemy',
          positions: [[0, 0], [0, 1], [0, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
      onDefend: [],
      onKill: [
        {
          id: 'ab_rostam_2',
          action: 'buffAttack',
          label: 'خروش پیروزی',
          icon: '⬆️',
          amount: 5,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
      onDeath: [],
    },
  },
  {
    name: 'تیرانداز البرز (تک‌تیرانداز)',
    badge: 'تک‌تیرانداز مرگبار',
    icon: '🏹',
    type: 'attacker',
    tier: 'legendary',
    attack: 45,
    health: 28,
    borderColor: '#00e5ff',
    aura: 'lightning',
    shopPrice: 1400,
    description: 'تیرانداز راه دور با نادیده گرفتن محافظ‌ها و ضربه بحرانی بالا.',
    passives: { ...defaultPassives(), ignoreGuard: true, pierce: true, crit: 40 },
    abilities: {
      onStart: [],
      onTurnStart: [],
      onAttack: [
        {
          id: 'ab_arash_1',
          action: 'damage',
          label: 'تیر سرنوشت البرز',
          icon: '⚡',
          amount: 12,
          targetSide: 'enemy',
          positions: [[0, 1], [1, 1], [2, 1]],
          targetCriteria: 'lowestHp',
          chancePercent: 100,
        },
      ],
      onDefend: [],
      onKill: [],
      onDeath: [
        {
          id: 'ab_arash_death',
          action: 'damage',
          label: 'تیر واپسین',
          icon: '💥',
          amount: 20,
          targetSide: 'enemy',
          positions: [[0, 0], [0, 1], [0, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
    },
  },
  {
    name: 'ققنوس سیمرغ (طبیب الهی)',
    badge: 'شفا و جاودانگی',
    icon: '🦅',
    type: 'mage',
    tier: 'god',
    attack: 18,
    health: 65,
    borderColor: '#ff6ec7',
    aura: 'gold',
    shopPrice: 2800,
    description: 'طبیب الهی با پرهای زرین که جان یاران را بازیابی کرده و رستاخیز می‌بخشد.',
    passives: { ...defaultPassives(), regen: 6, resurrect: 60, stealth: true },
    abilities: {
      onStart: [
        {
          id: 'ab_simurgh_shield',
          action: 'shield',
          label: 'سپر بال سیمرغ',
          icon: '🛡️',
          amount: 15,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
      onTurnStart: [
        {
          id: 'ab_simurgh_heal',
          action: 'heal',
          label: 'باران زندگی',
          icon: '✨',
          amount: 6,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2]],
          targetCriteria: 'lowestHp',
          chancePercent: 100,
        },
      ],
      onAttack: [],
      onDefend: [],
      onKill: [],
      onDeath: [],
    },
  },
  {
    name: 'دیو سپید کوهستان (دژبان یخی)',
    badge: 'دیو تانک و یخ',
    icon: '👹',
    type: 'defender',
    tier: 'legendary',
    attack: 22,
    health: 85,
    borderColor: '#1565c0',
    aura: 'ice',
    shopPrice: 1600,
    description: 'غول تانک با تحریک اجباری و پاتک‌های خارداری که حمله‌کنندگان را منجمد می‌سازد.',
    passives: { ...defaultPassives(), lastStand: true },
    abilities: {
      onStart: [
        {
          id: 'ab_div_taunt',
          action: 'taunt',
          label: 'نعره کوهستان',
          icon: '🎯',
          amount: 1,
          targetSide: 'ally',
          positions: [[4, 1]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
      onTurnStart: [],
      onAttack: [],
      onDefend: [
        {
          id: 'ab_div_thorns',
          action: 'thorns',
          label: 'خار صخره‌ای',
          icon: '🌵',
          amount: 8,
          targetSide: 'ally',
          positions: [[4, 1]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
        {
          id: 'ab_div_freeze',
          action: 'freeze',
          label: 'نفس منجمدکننده',
          icon: '❄️',
          amount: 1,
          targetSide: 'enemy',
          positions: [[1, 0], [1, 1], [1, 2]],
          targetCriteria: 'random',
          chancePercent: 80,
        },
      ],
      onKill: [],
      onDeath: [],
    },
  },
  {
    name: 'ضحاک ماردوش (جادوگر سم)',
    badge: 'جادوگر زهر و مکیدن',
    icon: '🐍',
    type: 'mage',
    tier: 'legendary',
    attack: 30,
    health: 48,
    borderColor: '#6a1b9a',
    aura: 'magic',
    shopPrice: 1800,
    description: 'جادوگر سیاه با گسترش سم‌های مرگبار و مکیدن سلامتی دشمنان.',
    passives: { ...defaultPassives(), doubleStrike: true },
    abilities: {
      onStart: [],
      onTurnStart: [
        {
          id: 'ab_zahak_poison',
          action: 'poison',
          label: 'زهر مارهای دوش',
          icon: '☠️',
          amount: 4,
          targetSide: 'enemy',
          positions: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
      onAttack: [
        {
          id: 'ab_zahak_drain',
          action: 'drain',
          label: 'مکیدن جوانی',
          icon: '🧛',
          amount: 6,
          targetSide: 'enemy',
          positions: [[1, 1]],
          targetCriteria: 'lowestHp',
          chancePercent: 100,
        },
      ],
      onDefend: [],
      onKill: [],
      onDeath: [],
    },
  },
  {
    name: 'جمشید شاه (پادشاه تمدن)',
    badge: 'شاهنشاه باستان',
    icon: '👑',
    type: 'king',
    tier: 'god',
    attack: 26,
    health: 60,
    borderColor: '#ffb300',
    aura: 'gold',
    shopPrice: 3200,
    description: 'پادشاه اسطوره‌ای که یارانش را تقویت کرده و خود از موانع مرگبار مصون است.',
    passives: { ...defaultPassives(), lastStand: true, rage: 2 },
    abilities: {
      onStart: [
        {
          id: 'ab_king_buff',
          action: 'buffAttack',
          label: 'فر کیانی پادشاه',
          icon: '✨',
          amount: 4,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
      onTurnStart: [],
      onAttack: [],
      onDefend: [],
      onKill: [],
      onDeath: [],
    },
  },
  {
    name: 'آذرخش آسمان (افسون طوفان)',
    badge: 'افسون ضربتی',
    icon: '⚡',
    type: 'spell',
    tier: 'medium',
    attack: 0,
    health: 1,
    borderColor: '#00e5ff',
    aura: 'lightning',
    shopPrice: 600,
    description: 'افسون یک‌باره که در شروع بازی ضربه‌ای سنگین و آتش به خط اول دشمن وارد می‌کند.',
    passives: defaultPassives(),
    abilities: {
      onStart: [
        {
          id: 'ab_spell_blast',
          action: 'damage',
          label: 'برخورد صاعقه',
          icon: '⚡',
          amount: 15,
          targetSide: 'enemy',
          positions: [[0, 0], [0, 1], [0, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
        {
          id: 'ab_spell_burn',
          action: 'burn',
          label: 'آتش جاودان',
          icon: '🔥',
          amount: 3,
          targetSide: 'enemy',
          positions: [[0, 0], [0, 1], [0, 2]],
          targetCriteria: 'all',
          chancePercent: 100,
        },
      ],
      onTurnStart: [],
      onAttack: [],
      onDefend: [],
      onKill: [],
      onDeath: [],
    },
  },
];

export const AURA_OPTIONS: { id: CardDef['aura']; label: string; desc: string }[] = [
  { id: 'none', label: 'بدون هاله', desc: 'ساده' },
  { id: 'fire', label: 'هاله آتش سرخ', desc: 'درخشش شعله‌های نبرد' },
  { id: 'magic', label: 'هاله بنفش جادویی', desc: 'انرژی اسرارآمیز ارغوانی' },
  { id: 'gold', label: 'هاله طلایی شاهانه', desc: 'فر کیانی و درخشش خدایان' },
  { id: 'ice', label: 'هاله یخی فیروزه‌ای', desc: 'سرمای کوهستان‌های دیوان' },
  { id: 'lightning', label: 'هاله صاعقه زرد', desc: 'برق و رعد اساطیری' },
];

export const TARGET_CRITERIA_OPTIONS = [
  { id: 'all', label: 'همه خانه‌های علامت‌زده' },
  { id: 'lowestHp', label: 'کم‌جان‌ترین کارت در محدوده' },
  { id: 'highestAtk', label: 'قوی‌ترین حمله در محدوده' },
  { id: 'random', label: 'یک هدف تصادفی در محدوده' },
];

export const SOUND_PRESETS = [
  { id: 'slash', label: 'برش شمشیر تیز', icon: '⚔️' },
  { id: 'attack', label: 'ضربه سنگین گرز', icon: '🔨' },
  { id: 'crit', label: 'ضربه بحرانی (انفجاری)', icon: '💥' },
  { id: 'dodge', label: 'باد و جاخالی سریع', icon: '💨' },
  { id: 'ability', label: 'زنگ جادویی و افسون', icon: '✨' },
  { id: 'taunt', label: 'طبل جنگ و تحریک', icon: '🥁' },
  { id: 'freeze', label: 'یخبندان کریستالی', icon: '❄️' },
  { id: 'poison', label: 'صدای فس‌فس سم مار', icon: '☠️' },
  { id: 'heal', label: 'شفابخشی آرامش‌بخش', icon: '💚' },
  { id: 'shield', label: 'سپر فلزی مقاوم', icon: '🛡️' },
  { id: 'death', label: 'فریاد نابودی و سقوط', icon: '💀' },
  { id: 'revive', label: 'هارمونی رستاخیز مقدس', icon: '👼' },
  { id: 'victory', label: 'سرود پیروزی شاهانه', icon: '🎺' },
];

export function calculateCardPowerScore(card: CardDef): {
  score: number;
  label: string;
  color: string;
  suggestedPrice: number;
} {
  let score = card.attack * 3 + card.health * 2;
  const p = card.passives || defaultPassives();

  if (p.doubleStrike) score += 35;
  if (p.cleave) score += 30;
  if (p.crit) score += Number(p.crit) * 0.8;
  if (p.resurrect) score += Number(p.resurrect) * 0.7;
  if (p.lastStand) score += 30;
  if (p.regen) score += Number(p.regen) * 4;
  if (p.berserk) score += Number(p.berserk) * 5;
  if (p.rage) score += Number(p.rage) * 4;
  if (p.pierce) score += 20;
  if (p.ignoreGuard) score += 25;
  if (p.stealth) score += 35;

  if (card.abilities) {
    Object.values(card.abilities).forEach((list) => {
      list.forEach((ab) => {
        score += (ab.amount || 2) * 3 + (ab.positions?.length || 1) * 2;
      });
    });
  }

  const tierMul =
    card.tier === 'god' ? 1.5 : card.tier === 'legendary' ? 1.25 : card.tier === 'medium' ? 1.1 : 1.0;
  const finalScore = Math.round(score * tierMul);
  const suggestedPrice = Math.max(50, Math.round(finalScore * 5));

  let label = 'متوازن';
  let color = 'text-emerald-400';
  if (finalScore > 350) {
    label = 'بسیار نیرومند (OP)';
    color = 'text-amber-400';
  } else if (card.attack > card.health * 1.5) {
    label = 'تهاجمی محض';
    color = 'text-rose-400';
  } else if (card.health > card.attack * 2.5) {
    label = 'دفاعی و سنگین';
    color = 'text-sky-400';
  }

  return { score: finalScore, label, color, suggestedPrice };
}
