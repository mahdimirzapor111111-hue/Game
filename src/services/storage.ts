import {
  UserProfile,
  CardDef,
  CardTier,
  AllPagesConfig,
  StageDef,
  CardPassives,
  MarketListing,
  GameAssetImage,
  ClanDef,
  ClanMember,
  ClanRole,
  ClanMessage,
  ClanJoinType,
  ClanJoinRequest,
  ChestConfig,
  UserGift,
  GameEvent,
  EventReward,
  AuthScreenConfig,
  UsdTransactionRequest,
  UsdTransactionType,
  UsdChatMessage,
  GlobalChatMessage,
  ChatChannel,
} from '../types/game';

// Import generated image assets
import imgRostam from '../assets/images/rostam_hero_1791041080508.jpg';
import imgArash from '../assets/images/arash_archer_1791041090715.jpg';
import imgSimurgh from '../assets/images/simurgh_mythic_1791041105767.jpg';
import imgDivSepid from '../assets/images/div_sepid_1791041120924.jpg';
import imgSohrab from '../assets/images/sohrab_hero_1791041145655.jpg';
import imgKaveh from '../assets/images/kaveh_smith_1791041157242.jpg';
import imgShopChest from '../assets/images/shop_chest_gold_1791041168090.jpg';
import imgBattleArena from '../assets/images/battle_arena_bg_1791041135260.jpg';
import { GAME_VISUALS } from '../assets/visuals';

const USERS_KEY = 'nabard_users_v3';
const ACTIVE_USER_ID_KEY = 'nabard_active_user_id_v3';
const CARDS_KEY = 'nabard_cards_v3';
const PAGES_CONFIG_KEY = 'nabard_pages_config_v3';
const STAGES_KEY = 'nabard_stages_v3';
const MARKET_KEY = 'nabard_market_v3';
const GAME_IMAGES_KEY = 'nabard_game_images_v1';
const CLANS_KEY = 'nabard_clans_v1';
const CHESTS_CONFIG_KEY = 'nabard_chests_config_v1';
const EVENTS_KEY = 'nabard_game_events_v2';
const AUTH_CONFIG_KEY = 'nabard_auth_config_v1';

export const DEFAULT_AUTH_CONFIG: AuthScreenConfig = {
  bgImage: GAME_VISUALS.authBg,
  overlayDarkness: 75,
  title: 'ورود به دربار نبرد پادشاهان',
  subtitle: 'دسترسی به تمام بخش‌های بازی، ذخیره ارتش، مسابقات و اتحادیه',
  loginButtonText: 'ورود به دربار 🏰',
  registerButtonText: 'ساخت حساب و شروع نبرد ⚔️',
  buttonIcon: '⚔️',
  buttonBannerImage: GAME_VISUALS.royalSealButton,
  badgeGlow: 'amber',
};

export function loadAuthConfig(): AuthScreenConfig {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG_KEY);
    if (!raw) return DEFAULT_AUTH_CONFIG;
    return { ...DEFAULT_AUTH_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUTH_CONFIG;
  }
}

export function saveAuthConfig(cfg: AuthScreenConfig): void {
  try {
    localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save auth config', err);
  }
}

export const CLAN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function defaultPassives(): CardPassives {
  return {
    doubleStrike: false,
    cleave: false,
    crit: 0,
    resurrect: 0,
    lastStand: false,
    regen: 0,
    berserk: 0,
    rage: 0,
    pierce: false,
    ignoreGuard: false,
    stealth: false,
  };
}

export function calculateCardProgressFromWins(totalWins: number) {
  let lvl = 1;
  let accumulated = 0;
  while (true) {
    const neededForNext = lvl;
    if (totalWins >= accumulated + neededForNext) {
      accumulated += neededForNext;
      lvl++;
    } else {
      const currentLevelWins = totalWins - accumulated;
      return {
        level: lvl,
        currentLevelWins,
        winsNeededForNextLevel: neededForNext,
        totalWins,
      };
    }
  }
}

export function getCardScaledStats(card: CardDef, progress?: { wins?: number; level?: number; xp?: number }) {
  let wins = progress?.wins ?? 0;
  let level = progress?.level || 1;
  if (progress?.wins !== undefined) {
    level = calculateCardProgressFromWins(progress.wins).level;
  }
  const bonusMultiplier = (level - 1) * 0.01;
  const attackBonus = level > 1 ? Math.max(level - 1, Math.round(card.attack * bonusMultiplier)) : 0;
  const healthBonus = level > 1 ? Math.max(level - 1, Math.round(card.health * bonusMultiplier)) : 0;
  const progressInfo = calculateCardProgressFromWins(wins);

  return {
    level,
    attack: card.attack + attackBonus,
    health: card.health + healthBonus,
    attackBonus,
    healthBonus,
    bonusPercent: level - 1,
    wins,
    currentLevelWins: progressInfo.currentLevelWins,
    winsNeededForNextLevel: progressInfo.winsNeededForNextLevel,
  };
}

export const FRESH_MYTHICAL_CARDS: CardDef[] = [
  {
    id: 'hero_rostam',
    name: 'رستم دستان',
    type: 'king',
    tier: 'god',
    attack: 25,
    health: 45,
    icon: '🤴',
    image: imgRostam,
    borderColor: '#ffd700',
    shopPrice: 1200,
    description: 'جهان‌پهلوان شاهنامه؛ گرز گاوسار و زره ببر بیان بر تن دارد و به یارانش قدرت افسانه‌ای می‌بخشد.',
    passives: {
      ...defaultPassives(),
      berserk: 3,
      crit: 35,
      lastStand: true,
    },
    abilities: {
      onStart: [
        {
          action: 'buffAttack',
          label: 'نعره جهان‌پهلوان',
          icon: '🦁',
          amount: 3,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [5, 0], [5, 1], [5, 2]],
        },
      ],
      onTurnStart: [],
      onAttack: [
        {
          action: 'splash',
          label: 'ضربه گرز سام',
          icon: '🔨',
          amount: 6,
          targetSide: 'enemy',
          positions: [],
        },
      ],
      onDefend: [
        {
          action: 'counterAttack',
          label: 'پاسخ ببر بیان',
          icon: '🛡️',
          amount: 8,
          targetSide: 'enemy',
          positions: [],
        },
      ],
      onKill: [
        {
          action: 'heal',
          label: 'روحیه دلاوری',
          icon: '❤️',
          amount: 5,
          targetSide: 'ally',
          positions: [],
        },
      ],
      onDeath: [],
    },
  },
  {
    id: 'hero_arash',
    name: 'آرش کمانگیر',
    type: 'attacker',
    tier: 'legendary',
    attack: 28,
    health: 22,
    icon: '🏹',
    image: imgArash,
    borderColor: '#00e5ff',
    shopPrice: 650,
    description: 'تیرانداز بی‌همتای البرز؛ با پرتاب تیر جادویی تمام موانع و زره‌های دشمن را شکافته و نابود می‌سازد.',
    passives: {
      ...defaultPassives(),
      ignoreGuard: true,
      pierce: true,
      crit: 40,
    },
    abilities: {
      onStart: [],
      onTurnStart: [],
      onAttack: [
        {
          action: 'execute',
          label: 'تیر سرنوشت',
          icon: '⚡',
          amount: 8,
          targetSide: 'enemy',
          positions: [],
        },
      ],
      onDefend: [],
      onKill: [],
      onDeath: [
        {
          action: 'damage',
          label: 'آخرین جان‌فشانی',
          icon: '💥',
          amount: 12,
          targetSide: 'enemy',
          positions: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
        },
      ],
    },
  },
  {
    id: 'hero_simurgh',
    name: 'سیمرغ حکمت',
    type: 'mage',
    tier: 'legendary',
    attack: 14,
    health: 32,
    icon: '🦅',
    image: imgSimurgh,
    borderColor: '#ff6ec7',
    shopPrice: 600,
    description: 'پرنده اساطیری قاف؛ بال‌هایش شفابخش زخم‌ها و پرهای زرینش سپری تسخیرناپذیر برای نیروهاست.',
    passives: {
      ...defaultPassives(),
      regen: 4,
      stealth: true,
    },
    abilities: {
      onStart: [
        {
          action: 'shield',
          label: 'پر جادویی سیمرغ',
          icon: '🛡️',
          amount: 8,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [5, 0], [5, 1], [5, 2]],
        },
      ],
      onTurnStart: [
        {
          action: 'heal',
          label: 'نسیم شفا',
          icon: '✨',
          amount: 4,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [5, 0], [5, 1], [5, 2]],
        },
      ],
      onAttack: [],
      onDefend: [],
      onKill: [],
      onDeath: [
        {
          action: 'healFull',
          label: 'جاودانگی پادشاه',
          icon: '💖',
          amount: 1,
          targetSide: 'ally',
          positions: [[5, 1]],
        },
      ],
    },
  },
  {
    id: 'hero_kaveh',
    name: 'کاوه آهنگر',
    type: 'defender',
    tier: 'medium',
    attack: 16,
    health: 38,
    icon: '⚒️',
    image: imgKaveh,
    borderColor: '#ff9800',
    shopPrice: 320,
    description: 'پرچمدار درفش کاویانی؛ با پتک سنگین خط مقدم را مستحکم کرده و دشمنان را مجازات می‌کند.',
    passives: {
      ...defaultPassives(),
    },
    abilities: {
      onStart: [
        {
          action: 'taunt',
          label: 'قیام درفش کاویانی',
          icon: '🚩',
          amount: 1,
          targetSide: 'ally',
          positions: [[4, 1]],
        },
      ],
      onTurnStart: [],
      onAttack: [],
      onDefend: [
        {
          action: 'thorns',
          label: 'ضربه پتک آهنگری',
          icon: '🌵',
          amount: 5,
          targetSide: 'ally',
          positions: [],
        },
      ],
      onKill: [],
      onDeath: [
        {
          action: 'buffAttack',
          label: 'خروش دادخواهی',
          icon: '⬆️',
          amount: 4,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2]],
        },
      ],
    },
  },
  {
    id: 'hero_siyavash',
    name: 'سیاوش پاک‌نهاد',
    type: 'defender',
    tier: 'medium',
    attack: 15,
    health: 34,
    icon: '🔥',
    borderColor: '#4caf50',
    shopPrice: 290,
    description: 'شاهزاده پاکی؛ از آتش پاک بیرون آمده و سم‌ها و جادوهای تاریک را از یارانش می‌زداید.',
    passives: {
      ...defaultPassives(),
      resurrect: 50,
    },
    abilities: {
      onStart: [
        {
          action: 'cleanse',
          label: 'آزمون آتش پاک',
          icon: '🧼',
          amount: 1,
          targetSide: 'ally',
          positions: [[3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [5, 0], [5, 1], [5, 2]],
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
    id: 'hero_div_sepid',
    name: 'دیو سپید مازندران',
    type: 'king',
    tier: 'god',
    attack: 22,
    health: 50,
    icon: '👹',
    image: imgDivSepid,
    borderColor: '#9c27b0',
    shopPrice: 1300,
    description: 'شاه دیوان تاریکی؛ یخبندان و زهر کشنده را در سراسر میدان نبرد می‌گستراند.',
    passives: {
      ...defaultPassives(),
      berserk: 2,
    },
    abilities: {
      onStart: [
        {
          action: 'freeze',
          label: 'جادوی سرمای دیوان',
          icon: '❄️',
          amount: 2,
          targetSide: 'enemy',
          positions: [[3, 0], [3, 2]],
        },
      ],
      onTurnStart: [
        {
          action: 'poison',
          label: 'مه سمی غار تاریک',
          icon: '☠️',
          amount: 2,
          targetSide: 'enemy',
          positions: [[3, 0], [3, 1], [3, 2]],
        },
      ],
      onAttack: [],
      onDefend: [
        {
          action: 'counterAttack',
          label: 'پنجه دیو',
          icon: '🗡️',
          amount: 6,
          targetSide: 'enemy',
          positions: [],
        },
      ],
      onKill: [],
      onDeath: [],
    },
  },
  {
    id: 'hero_sohrab',
    name: 'سهراب دلاور',
    type: 'attacker',
    tier: 'legendary',
    attack: 26,
    health: 26,
    icon: '⚔️',
    image: imgSohrab,
    borderColor: '#e91e63',
    shopPrice: 700,
    description: 'پهلوان جوان توران و ایران؛ با دو شمشیر آتشین به صفوف دشمن می‌تازد و جان آنان را می‌مکد.',
    passives: {
      ...defaultPassives(),
      doubleStrike: true,
      cleave: true,
    },
    abilities: {
      onStart: [],
      onTurnStart: [],
      onAttack: [
        {
          action: 'buffAttack',
          label: 'خشم جوانی',
          icon: '🔥',
          amount: 2,
          targetSide: 'ally',
          positions: [],
        },
      ],
      onDefend: [],
      onKill: [
        {
          action: 'lifesteal',
          label: 'مکیدن خون نبرد',
          icon: '🩸',
          amount: 6,
          targetSide: 'ally',
          positions: [],
        },
      ],
      onDeath: [],
    },
  },
  {
    id: 'spell_atash_varjam',
    name: 'افسون آتش ورجام',
    type: 'spell',
    tier: 'medium',
    attack: 0,
    health: 5,
    icon: '📜',
    borderColor: '#ff5722',
    shopPrice: 150,
    description: 'افسون تک‌مصرف آتشین؛ در شروع بازی صف مقدم حریف را به آتش می‌کشد.',
    passives: defaultPassives(),
    abilities: {
      onStart: [
        {
          action: 'burn',
          label: 'آذرخش سوزان',
          icon: '🔥',
          amount: 5,
          targetSide: 'enemy',
          positions: [[0, 0], [0, 1], [0, 2]],
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

export const DEFAULT_STAGES: StageDef[] = [
  {
    id: 'stage_1',
    title: 'مرحله ۱: خان دیوان مازندران',
    description: 'رو در روی طلایه‌داران دیوان تاریکی قرار بگیرید و مرزبانان را شکست دهید.',
    difficulty: 'easy',
    rewardGold: 150,
    rewardXp: 100,
    enemyFormation: [
      [null, FRESH_MYTHICAL_CARDS[5], null],
      [FRESH_MYTHICAL_CARDS[7], null, FRESH_MYTHICAL_CARDS[7]],
      [FRESH_MYTHICAL_CARDS[3], null, FRESH_MYTHICAL_CARDS[4]],
    ],
  },
  {
    id: 'stage_2',
    title: 'مرحله ۲: گذرگاه آتشین سهراب',
    description: 'نبرد با لشکر مهاجمان توران به رهبری جنگجویان سرسخت و تیراندازان مرگبار.',
    difficulty: 'medium',
    rewardGold: 300,
    rewardXp: 200,
    enemyFormation: [
      [FRESH_MYTHICAL_CARDS[2], FRESH_MYTHICAL_CARDS[5], FRESH_MYTHICAL_CARDS[2]],
      [FRESH_MYTHICAL_CARDS[1], FRESH_MYTHICAL_CARDS[6], FRESH_MYTHICAL_CARDS[1]],
      [FRESH_MYTHICAL_CARDS[3], FRESH_MYTHICAL_CARDS[4], FRESH_MYTHICAL_CARDS[3]],
    ],
  },
  {
    id: 'stage_3',
    title: 'مرحله ۳: نبرد نهایی شاهان اساطیر',
    description: 'رویارویی با پادشاهان فناناپذیر و موجودات جادویی در اوج قدرت و توان.',
    difficulty: 'boss',
    rewardGold: 800,
    rewardXp: 500,
    enemyFormation: [
      [FRESH_MYTHICAL_CARDS[0], FRESH_MYTHICAL_CARDS[5], FRESH_MYTHICAL_CARDS[2]],
      [FRESH_MYTHICAL_CARDS[6], FRESH_MYTHICAL_CARDS[3], FRESH_MYTHICAL_CARDS[1]],
      [FRESH_MYTHICAL_CARDS[4], FRESH_MYTHICAL_CARDS[7], FRESH_MYTHICAL_CARDS[4]],
    ],
  },
];

export const DEFAULT_MARKET_LISTINGS: MarketListing[] = [
  {
    id: 'mkt_usd_1',
    sellerId: 'user_sohrab_champion',
    sellerName: 'سهراب یل',
    sellerAvatar: imgSohrab,
    card: FRESH_MYTHICAL_CARDS[2],
    cardLevel: 2,
    type: 'direct',
    currency: 'usd',
    price: 15,
    currentBid: 15,
    bidsCount: 0,
    createdAt: Date.now() - 3600000 * 1,
    expiresAt: Date.now() + 86400000,
    status: 'active',
  },
  {
    id: 'mkt_usd_2',
    sellerId: 'user_arash_archer',
    sellerName: 'آرش کماندار',
    sellerAvatar: imgArash,
    card: FRESH_MYTHICAL_CARDS[4],
    cardLevel: 3,
    type: 'auction',
    currency: 'usd',
    price: 10,
    currentBid: 12,
    highestBidderId: 'user_player',
    highestBidderName: 'پهلوان نوپا',
    bidsCount: 2,
    createdAt: Date.now() - 3600000 * 4,
    expiresAt: Date.now() + 3600000 * 20,
    status: 'active',
  },
  {
    id: 'mkt_1',
    sellerId: 'user_admin',
    sellerName: 'مهدی میرزاپور (مدیر)',
    sellerAvatar: imgRostam,
    card: FRESH_MYTHICAL_CARDS[1],
    cardLevel: 2,
    type: 'direct',
    currency: 'gold',
    price: 550,
    currentBid: 550,
    bidsCount: 0,
    createdAt: Date.now() - 3600000 * 2,
    expiresAt: Date.now() + 86400000,
    status: 'active',
  },
  {
    id: 'mkt_2',
    sellerId: 'user_admin',
    sellerName: 'مهدی میرزاپور (مدیر)',
    sellerAvatar: imgRostam,
    card: FRESH_MYTHICAL_CARDS[6],
    cardLevel: 3,
    type: 'auction',
    currency: 'gold',
    price: 400,
    currentBid: 480,
    highestBidderId: 'user_player',
    highestBidderName: 'پهلوان نوپا',
    bidsCount: 3,
    createdAt: Date.now() - 3600000 * 6,
    expiresAt: Date.now() + 3600000 * 18,
    status: 'active',
  },
];

export const DEFAULT_PAGES_CONFIG: AllPagesConfig = {
  battlePage: {
    titleText: 'میدان نبرد اساطیری',
    titleColor: '#ffd54f',
    bgImage: imgBattleArena,
    bgColor: '#26150f',
    boardTexture: 'darkwood',
    borderColor: '#ffb300',
    dividerText: '⚔️ مرز نبرد اساطیر ⚔️',
    dividerColor: '#ffb300',
    endTurnBtnText: 'پایان نوبت',
    endTurnBtnBg: '#ffb300',
    endTurnBtnColor: '#000000',
    weatherEffect: 'none',
  },
  campaignPage: {
    titleText: 'نبردهای داستانی و هفت‌خوان',
    titleColor: '#ffd54f',
    subtitleText: 'مراحل را با پیروزی سپری کنید تا طلا، تجربه و جوایز اساطیری کسب کنید',
    bgImage: null,
    bgColor: '#120b08',
    cardBgColor: '#1c130f',
    cardBorderColor: '#4e342e',
    startBtnText: 'ورود به میدان',
    startBtnBg: '#ffb300',
  },
  deckPage: {
    titleText: 'چیدمان ارتش و کارت‌ها',
    titleColor: '#ffd54f',
    subtitleText: 'حداقل یک کارت پادشاه الزامی است؛ موقعیت‌ها را هوشمندانه بچینید',
    bgImage: null,
    bgColor: '#120b08',
    slotBorderColor: '#5d4037',
    saveBtnText: 'ذخیره ترکیب',
    saveBtnBg: '#ffb300',
  },
  shopPage: {
    titleText: 'بازارچه و صندوق‌های اساطیری',
    titleColor: '#ffd54f',
    subtitleText: 'صندوق‌های شانس را باز کنید یا کارت‌های نیرومند را مستقیماً بخرید',
    bgImage: null,
    bgColor: '#120b08',
    shopkeeperName: 'بازرگان کهن',
    bannerText: 'بهترین کارت‌های اساطیری ایران‌زمین با ضمانت اصالت!',
    pack1Name: 'صندوق چوبی برنز',
    pack2Name: 'صندوق سیمین نقره',
    pack3Name: 'صندوق زرین طلا',
  },
};

export const DEFAULT_GAME_IMAGES: GameAssetImage[] = [
  {
    id: 'img_rostam',
    name: 'رستم دستان',
    url: imgRostam,
    category: 'kings',
    createdAt: 1000,
  },
  {
    id: 'img_arash',
    name: 'آرش کمانگیر',
    url: imgArash,
    category: 'heroes',
    createdAt: 1001,
  },
  {
    id: 'img_simurgh',
    name: 'سیمرغ حکمت',
    url: imgSimurgh,
    category: 'creatures',
    createdAt: 1002,
  },
  {
    id: 'img_div_sepid',
    name: 'دیو سپید',
    url: imgDivSepid,
    category: 'creatures',
    createdAt: 1003,
  },
  {
    id: 'img_sohrab',
    name: 'سهراب دلاور',
    url: imgSohrab,
    category: 'heroes',
    createdAt: 1004,
  },
  {
    id: 'img_kaveh',
    name: 'کاوه آهنگر',
    url: imgKaveh,
    category: 'heroes',
    createdAt: 1005,
  },
  {
    id: 'img_chest_gold',
    name: 'صندوق زرین شاهانه',
    url: imgShopChest,
    category: 'custom',
    createdAt: 1006,
  },
  {
    id: 'img_arena_bg',
    name: 'میدان رزم باستانی',
    url: imgBattleArena,
    category: 'custom',
    createdAt: 1007,
  },
];

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user_admin',
    username: 'Mahdimirzapor',
    password: 'Mahdimirzapor',
    displayName: 'مهدی میرزاپور (مدیر کل)',
    title: '👑 شاهنشاه اسطوره‌ها',
    bio: 'جهان‌پهلوان و بنیان‌گذار دربار نبرد پادشاهان',
    role: 'admin',
    level: 10,
    xp: 2500,
    gold: 9999,
    gems: 500,
    usd: 250,
    trophies: 2850,
    wins: 48,
    losses: 1,
    totalDamage: 2420,
    unlockedCardIds: FRESH_MYTHICAL_CARDS.map((c) => c.id),
    activeDeck: [
      [FRESH_MYTHICAL_CARDS[3].id, null, FRESH_MYTHICAL_CARDS[4].id],
      [FRESH_MYTHICAL_CARDS[1].id, FRESH_MYTHICAL_CARDS[6].id, FRESH_MYTHICAL_CARDS[2].id],
      [null, FRESH_MYTHICAL_CARDS[0].id, null],
    ],
    cardProgress: {
      [FRESH_MYTHICAL_CARDS[0].id]: { wins: 6, level: 4, xp: 450 },
      [FRESH_MYTHICAL_CARDS[1].id]: { wins: 3, level: 3, xp: 220 },
    },
    campaignCompletedIndex: 3,
    avatar: imgRostam,
    createdAt: Date.now() - 86400000 * 10,
    lastLogin: Date.now(),
    clanId: 'clan_iran_lions',
    clanRole: 'sultan',
    lastClanLeaveTimestamp: null,
  },
  {
    id: 'user_sohrab_champion',
    username: 'sohrab',
    displayName: 'سهراب یل',
    title: '⚔️ دلاور بی‌باک',
    bio: 'در پی دیدار پدر و فتح تخت کیکاووس',
    role: 'player',
    level: 7,
    xp: 1450,
    gold: 2200,
    gems: 40,
    usd: 45,
    trophies: 1680,
    wins: 16,
    losses: 4,
    totalDamage: 980,
    unlockedCardIds: [
      FRESH_MYTHICAL_CARDS[0].id,
      FRESH_MYTHICAL_CARDS[1].id,
      FRESH_MYTHICAL_CARDS[4].id,
      FRESH_MYTHICAL_CARDS[2].id,
      FRESH_MYTHICAL_CARDS[3].id,
    ],
    activeDeck: [
      [FRESH_MYTHICAL_CARDS[4].id, null, FRESH_MYTHICAL_CARDS[3].id],
      [FRESH_MYTHICAL_CARDS[2].id, null, FRESH_MYTHICAL_CARDS[1].id],
      [null, FRESH_MYTHICAL_CARDS[0].id, null],
    ],
    cardProgress: {
      [FRESH_MYTHICAL_CARDS[0].id]: { wins: 3, level: 3, xp: 250 },
    },
    campaignCompletedIndex: 2,
    avatar: imgSohrab,
    createdAt: Date.now() - 86400000 * 6,
    lastLogin: Date.now() - 3600000,
    clanId: 'clan_iran_lions',
    clanRole: 'elder',
    lastClanLeaveTimestamp: null,
  },
  {
    id: 'user_arash_archer',
    username: 'arash',
    displayName: 'آرش کماندار',
    title: '🎯 تیرانداز البرز',
    bio: 'جانم در تیرم، تیرم در کمانم',
    role: 'player',
    level: 5,
    xp: 920,
    gold: 1400,
    gems: 25,
    usd: 30,
    trophies: 1150,
    wins: 11,
    losses: 3,
    totalDamage: 640,
    unlockedCardIds: [
      FRESH_MYTHICAL_CARDS[0].id,
      FRESH_MYTHICAL_CARDS[2].id,
      FRESH_MYTHICAL_CARDS[3].id,
      FRESH_MYTHICAL_CARDS[5].id,
    ],
    activeDeck: [
      [FRESH_MYTHICAL_CARDS[3].id, FRESH_MYTHICAL_CARDS[5].id, null],
      [null, FRESH_MYTHICAL_CARDS[2].id, null],
      [null, FRESH_MYTHICAL_CARDS[0].id, null],
    ],
    cardProgress: {
      [FRESH_MYTHICAL_CARDS[0].id]: { wins: 1, level: 2, xp: 100 },
    },
    campaignCompletedIndex: 1,
    avatar: imgArash,
    createdAt: Date.now() - 86400000 * 4,
    lastLogin: Date.now() - 7200000,
    clanId: 'clan_simurgh_order',
    clanRole: 'sultan',
    lastClanLeaveTimestamp: null,
  },
  {
    id: 'user_kaveh_smith',
    username: 'kaveh',
    displayName: 'کاوه آهنگر',
    title: '⚒️ قیام‌گر درفش کاویان',
    bio: 'پتک آهنگری بر سر ستمگران فرود می‌آید',
    role: 'player',
    level: 4,
    xp: 680,
    gold: 950,
    gems: 20,
    usd: 20,
    trophies: 740,
    wins: 7,
    losses: 2,
    totalDamage: 430,
    unlockedCardIds: [
      FRESH_MYTHICAL_CARDS[0].id,
      FRESH_MYTHICAL_CARDS[1].id,
      FRESH_MYTHICAL_CARDS[3].id,
    ],
    activeDeck: [
      [null, FRESH_MYTHICAL_CARDS[3].id, null],
      [FRESH_MYTHICAL_CARDS[1].id, null, null],
      [null, FRESH_MYTHICAL_CARDS[0].id, null],
    ],
    cardProgress: {},
    campaignCompletedIndex: 1,
    avatar: imgKaveh,
    createdAt: Date.now() - 86400000 * 3,
    lastLogin: Date.now() - 14400000,
    clanId: 'clan_iran_lions',
    clanRole: 'member',
    lastClanLeaveTimestamp: null,
  },
  {
    id: 'user_player',
    username: 'player',
    password: 'player123',
    displayName: 'پهلوان نوپا',
    title: '🛡️ مبارز تازه‌نفس',
    bio: 'آماده برای فتح میدان‌های نبرد شاهنامه',
    role: 'player',
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
    activeDeck: [
      [FRESH_MYTHICAL_CARDS[3].id, null, FRESH_MYTHICAL_CARDS[4].id],
      [FRESH_MYTHICAL_CARDS[1].id, null, FRESH_MYTHICAL_CARDS[2].id],
      [null, FRESH_MYTHICAL_CARDS[0].id, null],
    ],
    cardProgress: {},
    campaignCompletedIndex: 0,
    avatar: imgRostam,
    createdAt: Date.now() - 86400000,
    lastLogin: Date.now(),
    clanId: null,
    clanRole: null,
    lastClanLeaveTimestamp: null,
  },
];

export const DEFAULT_CLANS: ClanDef[] = [
  {
    id: 'clan_iran_lions',
    name: 'شیران ایران‌زمین',
    description: 'اتحادیه بزرگ پهلوانان و پادشاهان شاهنامه؛ همبستگی و قدرت در میدان نبرد',
    badge: '🦁',
    crestImage: GAME_VISUALS.clanLionCrest,
    sultanId: 'user_admin',
    sultanName: 'رستم دستان',
    requiredTrophies: 600,
    isClosed: false,
    level: 5,
    totalTrophies: 4800,
    createdAt: Date.now() - 86400000 * 15,
    members: [
      {
        userId: 'user_admin',
        username: 'admin',
        displayName: 'رستم دستان (مدیر)',
        avatar: imgRostam,
        role: 'sultan',
        trophies: 2380,
        level: 10,
        donations: 850,
        joinedAt: Date.now() - 86400000 * 15,
      },
      {
        userId: 'user_sohrab_champion',
        username: 'sohrab',
        displayName: 'سهراب یل',
        avatar: imgSohrab,
        role: 'elder',
        trophies: 1680,
        level: 7,
        donations: 520,
        joinedAt: Date.now() - 86400000 * 10,
      },
      {
        userId: 'user_kaveh_smith',
        username: 'kaveh',
        displayName: 'کاوه آهنگر',
        avatar: imgKaveh,
        role: 'member',
        trophies: 740,
        level: 4,
        donations: 210,
        joinedAt: Date.now() - 86400000 * 5,
      },
    ],
    messages: [
      {
        id: 'msg_1',
        senderId: 'user_admin',
        senderName: 'رستم دستان',
        senderAvatar: imgRostam,
        senderRole: 'sultan',
        text: 'به اتحادیه شیران ایران‌زمین خوش آمدید! برای نبردهای هفتگی آماده باشید.',
        timestamp: Date.now() - 3600000 * 4,
        type: 'chat',
      },
      {
        id: 'msg_2',
        senderId: 'user_sohrab_champion',
        senderName: 'سهراب یل',
        senderAvatar: imgSohrab,
        senderRole: 'elder',
        text: 'ترکیب جدید ارتش آماده است، دوستان برای دوئل دوستانه پیام دهید.',
        timestamp: Date.now() - 3600000 * 2,
        type: 'chat',
      },
    ],
  },
  {
    id: 'clan_simurgh_order',
    name: 'فرقه سیمرغ قاف',
    description: 'استادان جادو و شفا؛ نبرد با خرد و تاکتیک‌های برتر دفاعی',
    badge: '🦅',
    sultanId: 'user_arash_archer',
    sultanName: 'آرش کماندار',
    requiredTrophies: 300,
    isClosed: false,
    level: 3,
    totalTrophies: 1950,
    createdAt: Date.now() - 86400000 * 8,
    members: [
      {
        userId: 'user_arash_archer',
        username: 'arash',
        displayName: 'آرش کماندار',
        avatar: imgArash,
        role: 'sultan',
        trophies: 1150,
        level: 5,
        donations: 340,
        joinedAt: Date.now() - 86400000 * 8,
      },
    ],
    messages: [
      {
        id: 'msg_3',
        senderId: 'user_arash_archer',
        senderName: 'آرش کماندار',
        senderAvatar: imgArash,
        senderRole: 'sultan',
        text: 'سیمرغ پشتیبان یاران وفادار است.',
        timestamp: Date.now() - 3600000,
        type: 'chat',
      },
    ],
  },
];

export function loadAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    let list: UserProfile[] = DEFAULT_USERS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }

    // Ensure Mahdimirzapor admin user exists, has admin role, and correct password
    let needsSave = false;
    let foundAdmin = list.find((u) => u.username.toLowerCase() === 'mahdimirzapor');
    if (!foundAdmin) {
      // Find old admin if any and migrate, or insert DEFAULT_USERS[0]
      const oldAdminIndex = list.findIndex((u) => u.username.toLowerCase() === 'admin');
      if (oldAdminIndex >= 0) {
        list[oldAdminIndex] = {
          ...list[oldAdminIndex],
          username: 'Mahdimirzapor',
          password: 'Mahdimirzapor',
          displayName: 'مهدی میرزاپور (مدیر کل)',
          role: 'admin',
        };
        foundAdmin = list[oldAdminIndex];
      } else {
        foundAdmin = { ...DEFAULT_USERS[0] };
        list.unshift(foundAdmin);
      }
      needsSave = true;
    } else {
      if (foundAdmin.role !== 'admin' || foundAdmin.password !== 'Mahdimirzapor') {
        foundAdmin.role = 'admin';
        foundAdmin.password = 'Mahdimirzapor';
        needsSave = true;
      }
    }

    // Strict security: ensure NO OTHER account has admin role except Mahdimirzapor
    list.forEach((u) => {
      if (u.username.toLowerCase() !== 'mahdimirzapor' && u.role === 'admin') {
        u.role = 'player';
        needsSave = true;
      }
    });

    const mapped = list.map((u) => ({
      ...u,
      usd: typeof u.usd === 'number' ? u.usd : (u.role === 'admin' ? 250 : 25),
      trophies: u.trophies !== undefined ? u.trophies : Math.max(100, (u.wins || 0) * 30 + 120),
      cardProgress: u.cardProgress || {},
      campaignCompletedIndex: u.campaignCompletedIndex ?? 0,
      clanId: u.clanId ?? null,
      clanRole: u.clanRole ?? null,
      lastClanLeaveTimestamp: u.lastClanLeaveTimestamp ?? null,
      isBanned: !!u.isBanned,
      banReason: u.banReason || '',
      gifts: Array.isArray(u.gifts) ? u.gifts : [],
      eventProgress: u.eventProgress || {},
    }));

    if (needsSave || !raw) {
      saveAllUsers(mapped);
    }
    return mapped;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveAllUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
}

export function getActiveUserId(): string | null {
  return localStorage.getItem(ACTIVE_USER_ID_KEY);
}

export function setActiveUserId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_USER_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_USER_ID_KEY);
  }
}

export function getActiveUser(): UserProfile | null {
  checkAndDistributeEndedEvents();
  const id = getActiveUserId();
  if (!id) return null;
  const users = loadAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function updateUserProfile(updated: UserProfile): void {
  const users = loadAllUsers();
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx >= 0) {
    users[idx] = updated;
  } else {
    users.push(updated);
  }
  saveAllUsers(users);

  if (updated.clanId) {
    const clans = loadClans();
    const clan = clans.find((c) => c.id === updated.clanId);
    if (clan) {
      const member = clan.members.find((m) => m.userId === updated.id);
      if (member) {
        member.displayName = updated.displayName;
        member.avatar = updated.avatar;
        member.trophies = updated.trophies;
        member.level = updated.level;
        saveClans(clans);
      }
    }
  }
}

export function loadClans(): ClanDef[] {
  try {
    const raw = localStorage.getItem(CLANS_KEY);
    if (!raw) {
      saveClans(DEFAULT_CLANS);
      return DEFAULT_CLANS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveClans(DEFAULT_CLANS);
      return DEFAULT_CLANS;
    }
    return parsed;
  } catch {
    return DEFAULT_CLANS;
  }
}

export function saveClans(clans: ClanDef[]): void {
  try {
    localStorage.setItem(CLANS_KEY, JSON.stringify(clans));
  } catch (err) {
    console.error('Failed to save clans', err);
  }
}

export function getClanCooldownRemaining(user: UserProfile): {
  canJoin: boolean;
  remainingMs: number;
  formatted: string;
} {
  if (!user.lastClanLeaveTimestamp) {
    return { canJoin: true, remainingMs: 0, formatted: '' };
  }
  const elapsed = Date.now() - user.lastClanLeaveTimestamp;
  if (elapsed >= CLAN_COOLDOWN_MS) {
    return { canJoin: true, remainingMs: 0, formatted: '' };
  }
  const remainingMs = CLAN_COOLDOWN_MS - elapsed;
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours} ساعت و ${minutes} دقیقه`;
  } else if (minutes > 0) {
    formatted = `${minutes} دقیقه و ${seconds} ثانیه`;
  } else {
    formatted = `${seconds} ثانیه`;
  }
  return { canJoin: false, remainingMs, formatted };
}

export function createClan(
  user: UserProfile,
  params: {
    name: string;
    description: string;
    badge: string;
    crestImage?: string;
    bannerImage?: string;
    requiredTrophies: number;
    requiredLevel?: number;
    joinType?: ClanJoinType;
    isClosed?: boolean;
  }
): { success: boolean; clan?: ClanDef; error?: string } {
  if (user.clanId) {
    return { success: false, error: 'شما در حال حاضر عضو یک اتحادیه هستید.' };
  }
  const cooldown = getClanCooldownRemaining(user);
  if (!cooldown.canJoin) {
    return {
      success: false,
      error: `مهلت پیوستن به اتحادیه جدید باقی مانده است: ${cooldown.formatted}`,
    };
  }
  const cost = 300;
  if (user.gold < cost) {
    return { success: false, error: `برای ساخت اتحادیه به ${cost} سکه طلا نیاز دارید.` };
  }

  const newClanId = 'clan_' + Date.now();
  const sultanMember: ClanMember = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: 'sultan',
    trophies: user.trophies || 150,
    level: user.level,
    donations: 0,
    joinedAt: Date.now(),
  };

  const newClan: ClanDef = {
    id: newClanId,
    name: params.name.trim() || 'اتحادیه جدید',
    description: params.description.trim() || 'اتحادیه پهلوانان و دلاوران ایران‌زمین',
    badge: params.badge || '👑',
    crestImage: params.crestImage || GAME_VISUALS.clanLionCrest,
    bannerImage: params.bannerImage || GAME_VISUALS.clanHallBanner,
    sultanId: user.id,
    sultanName: user.displayName,
    requiredTrophies: params.requiredTrophies || 0,
    requiredLevel: params.requiredLevel || 1,
    joinType: params.joinType || (params.isClosed ? 'closed' : 'open'),
    joinRequests: [],
    isClosed: !!params.isClosed || params.joinType === 'closed',
    members: [sultanMember],
    level: 1,
    totalTrophies: user.trophies || 150,
    createdAt: Date.now(),
    messages: [
      {
        id: 'msg_' + Date.now(),
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.avatar,
        senderRole: 'sultan',
        text: `اتحادیه ${params.name.trim()} توسط سلطان ${user.displayName} پایه‌گذاری شد!`,
        timestamp: Date.now(),
        type: 'system',
      },
    ],
  };

  const clans = loadClans();
  clans.unshift(newClan);
  saveClans(clans);

  const updatedUser: UserProfile = {
    ...user,
    gold: user.gold - cost,
    clanId: newClanId,
    clanRole: 'sultan',
    lastClanLeaveTimestamp: null,
  };
  updateUserProfile(updatedUser);

  return { success: true, clan: newClan };
}

export function joinClan(
  user: UserProfile,
  clanId: string
): { success: boolean; clan?: ClanDef; error?: string; pendingApproval?: boolean } {
  if (user.clanId) {
    return { success: false, error: 'شما قبلاً در یک اتحادیه عضو شده‌اید.' };
  }
  const cooldown = getClanCooldownRemaining(user);
  if (!cooldown.canJoin) {
    return {
      success: false,
      error: `مهلت پیوستن به اتحادیه جدید باقی مانده است: ${cooldown.formatted}`,
    };
  }
  const clans = loadClans();
  const clan = clans.find((c) => c.id === clanId);
  if (!clan) {
    return { success: false, error: 'اتحادیه مورد نظر یافت نشد.' };
  }
  if (clan.isClosed || clan.joinType === 'closed') {
    return { success: false, error: 'ورود به این اتحادیه در حال حاضر بسته است.' };
  }
  if (clan.members.length >= 50) {
    return { success: false, error: 'ظرفیت این اتحادیه تکمیل است (۵۰/۵۰).' };
  }
  if ((user.trophies || 0) < clan.requiredTrophies) {
    return {
      success: false,
      error: `کاپ مورد نیاز برای ورود به این اتحادیه ${clan.requiredTrophies} است (کاپ شما: ${user.trophies || 0}).`,
    };
  }
  if (clan.requiredLevel && user.level < clan.requiredLevel) {
    return {
      success: false,
      error: `سطح (لول) مورد نیاز برای ورود ${clan.requiredLevel} است (سطح شما: ${user.level}).`,
    };
  }

  // If clan requires approval (invite_only)
  if (clan.joinType === 'invite_only') {
    if (!clan.joinRequests) clan.joinRequests = [];
    if (clan.joinRequests.some((r) => r.userId === user.id)) {
      return { success: false, error: 'درخواست عضویت شما قبلاً ارسال شده و در انتظار تایید صاحب کلن است.' };
    }
    const newReq: ClanJoinRequest = {
      id: 'req_' + Date.now() + Math.random().toString(36).substring(2, 5),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      trophies: user.trophies || 150,
      level: user.level,
      requestedAt: Date.now(),
    };
    clan.joinRequests.push(newReq);
    clan.messages.push({
      id: 'msg_' + Date.now(),
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      senderRole: 'member',
      text: `پهلوان ${user.displayName} درخواست ورود به اتحادیه را ارسال کرد.`,
      timestamp: Date.now(),
      type: 'system',
    });
    saveClans(clans);
    return { success: true, pendingApproval: true, clan };
  }

  // Direct join for open clan
  const newMember: ClanMember = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: 'member',
    trophies: user.trophies || 0,
    level: user.level,
    donations: 0,
    joinedAt: Date.now(),
  };

  clan.members.push(newMember);
  clan.totalTrophies = clan.members.reduce((sum, m) => sum + (m.trophies || 0), 0);
  clan.messages.push({
    id: 'msg_' + Date.now(),
    senderId: user.id,
    senderName: user.displayName,
    senderAvatar: user.avatar,
    senderRole: 'member',
    text: `پهلوان ${user.displayName} به اتحادیه پیوست.`,
    timestamp: Date.now(),
    type: 'system',
  });
  saveClans(clans);

  const updatedUser: UserProfile = {
    ...user,
    clanId: clan.id,
    clanRole: 'member',
    lastClanLeaveTimestamp: null,
  };
  updateUserProfile(updatedUser);

  return { success: true, clan };
}

export function leaveClan(user: UserProfile): { success: boolean; error?: string } {
  if (!user.clanId) {
    return { success: false, error: 'شما در اتحادیه‌ای عضو نیستید.' };
  }
  const clans = loadClans();
  const clan = clans.find((c) => c.id === user.clanId);
  if (!clan) {
    const updatedUser: UserProfile = {
      ...user,
      clanId: null,
      clanRole: null,
      lastClanLeaveTimestamp: Date.now(),
    };
    updateUserProfile(updatedUser);
    return { success: true };
  }

  const memberIdx = clan.members.findIndex((m) => m.userId === user.id);
  const wasSultan = user.clanRole === 'sultan' || clan.sultanId === user.id;

  if (memberIdx >= 0) {
    clan.members.splice(memberIdx, 1);
  }

  if (wasSultan && clan.members.length > 0) {
    clan.members.sort((a, b) => {
      if (a.role === 'elder' && b.role !== 'elder') return -1;
      if (b.role === 'elder' && a.role !== 'elder') return 1;
      return (b.trophies || 0) - (a.trophies || 0);
    });
    const newSultan = clan.members[0];
    newSultan.role = 'sultan';
    clan.sultanId = newSultan.userId;
    clan.sultanName = newSultan.displayName;

    const allUsers = loadAllUsers();
    const newSultanUser = allUsers.find((u) => u.id === newSultan.userId);
    if (newSultanUser) {
      newSultanUser.clanRole = 'sultan';
      saveAllUsers(allUsers);
    }

    clan.messages.push({
      id: 'msg_' + Date.now(),
      senderId: 'system',
      senderName: 'سیستم',
      senderAvatar: '🏛️',
      senderRole: 'sultan',
      text: `سلطان قبلی اتحادیه را ترک کرد. ${newSultan.displayName} به عنوان سلطان جدید منصوب شد.`,
      timestamp: Date.now(),
      type: 'system',
    });
  } else if (clan.members.length === 0) {
    const filteredClans = clans.filter((c) => c.id !== clan.id);
    saveClans(filteredClans);
  } else {
    clan.messages.push({
      id: 'msg_' + Date.now(),
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      senderRole: 'member',
      text: `${user.displayName} اتحادیه را ترک کرد.`,
      timestamp: Date.now(),
      type: 'system',
    });
    clan.totalTrophies = clan.members.reduce((sum, m) => sum + (m.trophies || 0), 0);
    saveClans(clans);
  }

  const updatedUser: UserProfile = {
    ...user,
    clanId: null,
    clanRole: null,
    lastClanLeaveTimestamp: Date.now(),
  };
  updateUserProfile(updatedUser);

  return { success: true };
}

export function kickClanMember(
  sultanUser: UserProfile,
  targetUserId: string
): { success: boolean; error?: string } {
  if (!sultanUser.clanId) return { success: false, error: 'شما در اتحادیه نیستید.' };
  if (sultanUser.clanRole !== 'sultan' && sultanUser.clanRole !== 'elder' && sultanUser.role !== 'admin') {
    return { success: false, error: 'تنها سلطان و بزرگان اتحادیه اجازه اخراج اعضا را دارند.' };
  }
  if (sultanUser.id === targetUserId) {
    return { success: false, error: 'نمی‌توانید خود را اخراج کنید.' };
  }
  const clans = loadClans();
  const clan = clans.find((c) => c.id === sultanUser.clanId);
  if (!clan) return { success: false, error: 'اتحادیه یافت نشد.' };

  const targetIdx = clan.members.findIndex((m) => m.userId === targetUserId);
  if (targetIdx < 0) return { success: false, error: 'عضو مورد نظر در اتحادیه نیست.' };
  const targetMember = clan.members[targetIdx];

  // Elders can only kick normal members, not elders or sultans
  if (sultanUser.clanRole === 'elder' && (targetMember.role === 'elder' || targetMember.role === 'sultan')) {
    return { success: false, error: 'بزرگان تنها اجازه اخراج اعضای عادی را دارند.' };
  }

  clan.members.splice(targetIdx, 1);
  clan.totalTrophies = clan.members.reduce((sum, m) => sum + (m.trophies || 0), 0);

  clan.messages.push({
    id: 'msg_' + Date.now(),
    senderId: sultanUser.id,
    senderName: sultanUser.displayName,
    senderAvatar: sultanUser.avatar,
    senderRole: sultanUser.clanRole || 'sultan',
    text: `عضو ${targetMember.displayName} توسط ${sultanUser.displayName} از اتحادیه اخراج شد.`,
    timestamp: Date.now(),
    type: 'system',
  });
  saveClans(clans);

  const allUsers = loadAllUsers();
  const kickedUser = allUsers.find((u) => u.id === targetUserId);
  if (kickedUser) {
    kickedUser.clanId = null;
    kickedUser.clanRole = null;
    kickedUser.lastClanLeaveTimestamp = Date.now();
    saveAllUsers(allUsers);
  }
  return { success: true };
}

export function approveClanJoinRequest(
  sultanUser: UserProfile,
  clanId: string,
  requestId: string
): { success: boolean; error?: string } {
  if (sultanUser.clanRole !== 'sultan' && sultanUser.clanRole !== 'elder' && sultanUser.role !== 'admin') {
    return { success: false, error: 'تنها سلطان یا بزرگان اتحادیه اجازه تایید درخواست‌ها را دارند.' };
  }
  const clans = loadClans();
  const clan = clans.find((c) => c.id === clanId);
  if (!clan) return { success: false, error: 'اتحادیه یافت نشد.' };
  if (!clan.joinRequests) clan.joinRequests = [];

  const reqIndex = clan.joinRequests.findIndex((r) => r.id === requestId);
  if (reqIndex < 0) return { success: false, error: 'درخواست مورد نظر یافت نشد.' };

  const req = clan.joinRequests[reqIndex];
  if (clan.members.length >= 50) {
    return { success: false, error: 'ظرفیت اتحادیه تکمیل است (۵۰/۵۰).' };
  }

  // Remove request
  clan.joinRequests.splice(reqIndex, 1);

  // Add member
  const newMember: ClanMember = {
    userId: req.userId,
    username: req.username,
    displayName: req.displayName,
    avatar: req.avatar,
    role: 'member',
    trophies: req.trophies,
    level: req.level,
    donations: 0,
    joinedAt: Date.now(),
  };
  clan.members.push(newMember);
  clan.totalTrophies = clan.members.reduce((sum, m) => sum + (m.trophies || 0), 0);

  clan.messages.push({
    id: 'msg_' + Date.now(),
    senderId: sultanUser.id,
    senderName: sultanUser.displayName,
    senderAvatar: sultanUser.avatar,
    senderRole: sultanUser.clanRole || 'sultan',
    text: `درخواست عضویت پهلوان ${req.displayName} توسط ${sultanUser.displayName} تایید شد. خوش آمدید! 🛡️`,
    timestamp: Date.now(),
    type: 'system',
  });
  saveClans(clans);

  // Update target user profile
  const allUsers = loadAllUsers();
  const targetU = allUsers.find((u) => u.id === req.userId);
  if (targetU) {
    targetU.clanId = clan.id;
    targetU.clanRole = 'member';
    targetU.lastClanLeaveTimestamp = null;
    saveAllUsers(allUsers);
  }

  return { success: true };
}

export function rejectClanJoinRequest(
  sultanUser: UserProfile,
  clanId: string,
  requestId: string
): { success: boolean; error?: string } {
  if (sultanUser.clanRole !== 'sultan' && sultanUser.clanRole !== 'elder' && sultanUser.role !== 'admin') {
    return { success: false, error: 'تنها سلطان یا بزرگان اتحادیه اجازه رد درخواست‌ها را دارند.' };
  }
  const clans = loadClans();
  const clan = clans.find((c) => c.id === clanId);
  if (!clan || !clan.joinRequests) return { success: false, error: 'اتحادیه یافت نشد.' };

  const reqIndex = clan.joinRequests.findIndex((r) => r.id === requestId);
  if (reqIndex < 0) return { success: false, error: 'درخواست یافت نشد.' };

  clan.joinRequests.splice(reqIndex, 1);
  saveClans(clans);
  return { success: true };
}

export function promoteClanMember(
  sultanUser: UserProfile,
  targetUserId: string,
  newRole: ClanRole
): { success: boolean; error?: string } {
  if (sultanUser.clanRole !== 'sultan' && sultanUser.role !== 'admin') {
    return { success: false, error: 'تنها سلطان اجازه تغییر سمت اعضا را دارد.' };
  }
  const clans = loadClans();
  const clan = clans.find((c) => c.id === sultanUser.clanId);
  if (!clan) return { success: false, error: 'اتحادیه یافت نشد.' };

  const member = clan.members.find((m) => m.userId === targetUserId);
  if (!member) return { success: false, error: 'عضو یافت نشد.' };

  if (newRole === 'sultan') {
    const oldSultanMember = clan.members.find((m) => m.userId === sultanUser.id);
    if (oldSultanMember) oldSultanMember.role = 'elder';
    member.role = 'sultan';
    clan.sultanId = member.userId;
    clan.sultanName = member.displayName;

    const allUsers = loadAllUsers();
    const oldU = allUsers.find((u) => u.id === sultanUser.id);
    if (oldU) oldU.clanRole = 'elder';
    const newU = allUsers.find((u) => u.id === member.userId);
    if (newU) newU.clanRole = 'sultan';
    saveAllUsers(allUsers);

    clan.messages.push({
      id: 'msg_' + Date.now(),
      senderId: sultanUser.id,
      senderName: sultanUser.displayName,
      senderAvatar: sultanUser.avatar,
      senderRole: 'sultan',
      text: `مقام سلطنت اتحادیه به ${member.displayName} واگذار شد.`,
      timestamp: Date.now(),
      type: 'system',
    });
  } else {
    member.role = newRole;
    const allUsers = loadAllUsers();
    const targetU = allUsers.find((u) => u.id === member.userId);
    if (targetU) {
      targetU.clanRole = newRole;
      saveAllUsers(allUsers);
    }
    clan.messages.push({
      id: 'msg_' + Date.now(),
      senderId: sultanUser.id,
      senderName: sultanUser.displayName,
      senderAvatar: sultanUser.avatar,
      senderRole: 'sultan',
      text: `مقام ${member.displayName} به ${newRole === 'elder' ? 'بزرگ‌تر اتحادیه' : 'عضو عادی'} ارتقا یافت.`,
      timestamp: Date.now(),
      type: 'system',
    });
  }
  saveClans(clans);
  return { success: true };
}

export function updateClanDetails(
  sultanUser: UserProfile,
  details: {
    name?: string;
    description?: string;
    badge?: string;
    crestImage?: string;
    bannerImage?: string;
    requiredTrophies?: number;
    requiredLevel?: number;
    joinType?: ClanJoinType;
    isClosed?: boolean;
  }
): { success: boolean; error?: string } {
  if (sultanUser.clanRole !== 'sultan' && sultanUser.role !== 'admin') {
    return { success: false, error: 'تنها سلطان اجازه ویرایش اطلاعات اتحادیه را دارد.' };
  }
  const clans = loadClans();
  const clan = clans.find((c) => c.id === sultanUser.clanId);
  if (!clan) return { success: false, error: 'اتحادیه یافت نشد.' };

  if (details.name) clan.name = details.name.trim();
  if (details.description !== undefined) clan.description = details.description.trim();
  if (details.badge) clan.badge = details.badge;
  if (details.crestImage !== undefined) clan.crestImage = details.crestImage;
  if (details.bannerImage !== undefined) clan.bannerImage = details.bannerImage;
  if (details.requiredTrophies !== undefined) clan.requiredTrophies = details.requiredTrophies;
  if (details.requiredLevel !== undefined) clan.requiredLevel = details.requiredLevel;
  if (details.joinType !== undefined) {
    clan.joinType = details.joinType;
    clan.isClosed = details.joinType === 'closed';
  } else if (details.isClosed !== undefined) {
    clan.isClosed = details.isClosed;
    clan.joinType = details.isClosed ? 'closed' : (clan.joinType || 'open');
  }

  saveClans(clans);
  return { success: true };
}

export function sendClanMessage(
  user: UserProfile,
  text: string,
  type: 'chat' | 'duel_request' = 'chat'
): boolean {
  if (!user.clanId || !text.trim()) return false;
  const clans = loadClans();
  const clan = clans.find((c) => c.id === user.clanId);
  if (!clan) return false;

  const newMsg: ClanMessage = {
    id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 5),
    senderId: user.id,
    senderName: user.displayName,
    senderAvatar: user.avatar,
    senderRole: user.clanRole || 'member',
    text: text.trim(),
    timestamp: Date.now(),
    type,
  };
  clan.messages.push(newMsg);
  if (clan.messages.length > 100) {
    clan.messages = clan.messages.slice(-100);
  }
  saveClans(clans);
  return true;
}

export function loadCards(): CardDef[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) {
      saveCards(FRESH_MYTHICAL_CARDS);
      return FRESH_MYTHICAL_CARDS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return FRESH_MYTHICAL_CARDS;
    }
    return parsed;
  } catch {
    return FRESH_MYTHICAL_CARDS;
  }
}

export function saveCards(cards: CardDef[]): void {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch (err) {
    console.error('Failed to save cards', err);
  }
}

export function wipeAllCards(): void {
  saveCards([]);
}

export function seedFreshMythicalCards(): CardDef[] {
  saveCards(FRESH_MYTHICAL_CARDS);
  return FRESH_MYTHICAL_CARDS;
}

export function loadStages(): StageDef[] {
  try {
    const raw = localStorage.getItem(STAGES_KEY);
    if (!raw) {
      saveStages(DEFAULT_STAGES);
      return DEFAULT_STAGES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STAGES;
  }
}

export function saveStages(stages: StageDef[]): void {
  try {
    localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
  } catch (err) {
    console.error('Failed to save stages', err);
  }
}

export function loadPagesConfig(): AllPagesConfig {
  try {
    const raw = localStorage.getItem(PAGES_CONFIG_KEY);
    if (!raw) {
      savePagesConfig(DEFAULT_PAGES_CONFIG);
      return DEFAULT_PAGES_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      battlePage: { ...DEFAULT_PAGES_CONFIG.battlePage, ...(parsed.battlePage || {}) },
      campaignPage: { ...DEFAULT_PAGES_CONFIG.campaignPage, ...(parsed.campaignPage || {}) },
      deckPage: { ...DEFAULT_PAGES_CONFIG.deckPage, ...(parsed.deckPage || {}) },
      shopPage: { ...DEFAULT_PAGES_CONFIG.shopPage, ...(parsed.shopPage || {}) },
    };
  } catch {
    return DEFAULT_PAGES_CONFIG;
  }
}

export function savePagesConfig(config: AllPagesConfig): void {
  try {
    localStorage.setItem(PAGES_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save page configs', err);
  }
}

export function loadMarketListings(): MarketListing[] {
  try {
    const raw = localStorage.getItem(MARKET_KEY);
    if (!raw) {
      saveMarketListings(DEFAULT_MARKET_LISTINGS);
      return DEFAULT_MARKET_LISTINGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveMarketListings(DEFAULT_MARKET_LISTINGS);
      return DEFAULT_MARKET_LISTINGS;
    }
    return parsed;
  } catch {
    return DEFAULT_MARKET_LISTINGS;
  }
}

export function saveMarketListings(listings: MarketListing[]): void {
  try {
    localStorage.setItem(MARKET_KEY, JSON.stringify(listings));
  } catch (err) {
    console.error('Failed to save market listings', err);
  }
}

export function createMarketListing(
  user: UserProfile,
  card: CardDef,
  cardLevel: number,
  type: 'direct' | 'auction',
  price: number,
  currency: 'gold' | 'usd' = 'gold'
): boolean {
  if (!user.unlockedCardIds.includes(card.id)) return false;
  const newUnlocked = user.unlockedCardIds.filter((cid) => cid !== card.id);
  const newDeck = user.activeDeck.map((r) => r.map((cid) => (cid === card.id ? null : cid)));
  const updatedUser: UserProfile = {
    ...user,
    unlockedCardIds: newUnlocked,
    activeDeck: newDeck,
  };
  updateUserProfile(updatedUser);

  const newListing: MarketListing = {
    id: 'mkt_' + Date.now(),
    sellerId: user.id,
    sellerName: user.displayName,
    sellerAvatar: user.avatar,
    card,
    cardLevel,
    type,
    currency,
    price,
    currentBid: price,
    bidsCount: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
    status: 'active',
  };
  const listings = loadMarketListings();
  listings.unshift(newListing);
  saveMarketListings(listings);
  return true;
}

export function buyDirectListing(listingId: string, buyer: UserProfile): { success: boolean; error?: string } {
  const listings = loadMarketListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing || listing.status !== 'active') {
    return { success: false, error: 'این کالا دیگر فعال نیست.' };
  }
  if (listing.type !== 'direct') {
    return { success: false, error: 'این کالا برای خرید مستقیم نیست.' };
  }
  if (listing.sellerId === buyer.id) {
    return { success: false, error: 'نمی‌توانید کارت خود را بخرید!' };
  }

  const isUsd = listing.currency === 'usd';

  if (isUsd) {
    if ((buyer.usd || 0) < listing.price) {
      return { success: false, error: `موجودی دلار شما کافی نیست. ($${buyer.usd || 0} دارید، قیمت: $${listing.price})` };
    }
  } else {
    if (buyer.gold < listing.price) {
      return { success: false, error: 'موجودی سکه طلای شما کافی نیست.' };
    }
  }

  const updatedBuyer: UserProfile = {
    ...buyer,
    gold: isUsd ? buyer.gold : buyer.gold - listing.price,
    usd: isUsd ? (buyer.usd || 0) - listing.price : (buyer.usd || 0),
    unlockedCardIds: Array.from(new Set([...buyer.unlockedCardIds, listing.card.id])),
    cardProgress: {
      ...buyer.cardProgress,
      [listing.card.id]: {
        wins: listing.cardLevel > 1 ? listing.cardLevel - 1 : 0,
        xp: 0,
        level: listing.cardLevel || 1,
      },
    },
  };
  updateUserProfile(updatedBuyer);

  const allUsers = loadAllUsers();
  const seller = allUsers.find((u) => u.id === listing.sellerId);
  if (seller) {
    if (isUsd) {
      seller.usd = (seller.usd || 0) + listing.price;
    } else {
      seller.gold += listing.price;
    }
    saveAllUsers(allUsers);
  }

  listing.status = 'sold';
  saveMarketListings(listings);
  return { success: true };
}

export function bidOnAuction(
  listingId: string,
  bidder: UserProfile,
  bidAmount: number
): { success: boolean; error?: string } {
  const listings = loadMarketListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing || listing.status !== 'active') {
    return { success: false, error: 'این مزایده فعال نیست.' };
  }
  if (listing.type !== 'auction') {
    return { success: false, error: 'این آیتم مزایده‌ای نیست.' };
  }
  if (listing.sellerId === bidder.id) {
    return { success: false, error: 'نمی‌توانید در مزایده خود پیشنهاد دهید!' };
  }
  if (bidAmount <= listing.currentBid) {
    const symbol = listing.currency === 'usd' ? '$' : 'سکه';
    return { success: false, error: `پیشنهاد شما باید بیشتر از پیشنهاد فعلی (${listing.currentBid} ${symbol}) باشد.` };
  }

  const isUsd = listing.currency === 'usd';

  if (isUsd) {
    if ((bidder.usd || 0) < bidAmount) {
      return { success: false, error: `موجودی دلار شما کافی نیست. ($${bidder.usd || 0})` };
    }
  } else {
    if (bidder.gold < bidAmount) {
      return { success: false, error: 'سکه طلای کافی برای این پیشنهاد ندارید.' };
    }
  }

  if (listing.highestBidderId) {
    const allUsers = loadAllUsers();
    const prevBidder = allUsers.find((u) => u.id === listing.highestBidderId);
    if (prevBidder) {
      if (isUsd) {
        prevBidder.usd = (prevBidder.usd || 0) + listing.currentBid;
      } else {
        prevBidder.gold += listing.currentBid;
      }
      saveAllUsers(allUsers);
    }
  }

  const updatedBidder: UserProfile = {
    ...bidder,
    gold: isUsd ? bidder.gold : bidder.gold - bidAmount,
    usd: isUsd ? (bidder.usd || 0) - bidAmount : (bidder.usd || 0),
  };
  updateUserProfile(updatedBidder);

  listing.currentBid = bidAmount;
  listing.highestBidderId = bidder.id;
  listing.highestBidderName = bidder.displayName;
  listing.bidsCount += 1;
  saveMarketListings(listings);
  return { success: true };
}

export function finalizeAuction(listingId: string): { success: boolean; message: string } {
  const listings = loadMarketListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing || listing.status !== 'active') {
    return { success: false, message: 'مزایده نامعتبر است.' };
  }

  const isUsd = listing.currency === 'usd';
  const allUsers = loadAllUsers();
  const unit = isUsd ? '$' : 'سکه';

  if (listing.highestBidderId) {
    const winner = allUsers.find((u) => u.id === listing.highestBidderId);
    if (winner) {
      winner.unlockedCardIds = Array.from(new Set([...winner.unlockedCardIds, listing.card.id]));
      winner.cardProgress = {
        ...winner.cardProgress,
        [listing.card.id]: {
          wins: listing.cardLevel > 1 ? listing.cardLevel - 1 : 0,
          xp: 0,
          level: listing.cardLevel || 1,
        },
      };
    }
    const seller = allUsers.find((u) => u.id === listing.sellerId);
    if (seller) {
      if (isUsd) {
        seller.usd = (seller.usd || 0) + listing.currentBid;
      } else {
        seller.gold += listing.currentBid;
      }
    }
    saveAllUsers(allUsers);

    listing.status = 'sold';
    saveMarketListings(listings);
    return { success: true, message: `کارت با مبلغ ${listing.currentBid} ${unit} به ${listing.highestBidderName} فروخته شد!` };
  } else {
    const seller = allUsers.find((u) => u.id === listing.sellerId);
    if (seller) {
      seller.unlockedCardIds = Array.from(new Set([...seller.unlockedCardIds, listing.card.id]));
      saveAllUsers(allUsers);
    }
    listing.status = 'expired';
    saveMarketListings(listings);
    return { success: true, message: 'مزایده بدون خریدار منقضی شد.' };
  }
}

export function loadGameImages(): GameAssetImage[] {
  try {
    const raw = localStorage.getItem(GAME_IMAGES_KEY);
    if (!raw) {
      saveGameImages(DEFAULT_GAME_IMAGES);
      return DEFAULT_GAME_IMAGES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveGameImages(DEFAULT_GAME_IMAGES);
      return DEFAULT_GAME_IMAGES;
    }
    return parsed;
  } catch {
    return DEFAULT_GAME_IMAGES;
  }
}

export function saveGameImages(images: GameAssetImage[]): void {
  try {
    localStorage.setItem(GAME_IMAGES_KEY, JSON.stringify(images));
  } catch (err) {
    console.error('Failed to save game images', err);
  }
}

export function addGameImage(image: GameAssetImage): void {
  const current = loadGameImages();
  const updated = [image, ...current.filter((x) => x.id !== image.id)];
  saveGameImages(updated);
}

export function updateGameImage(updatedImage: GameAssetImage): void {
  const current = loadGameImages();
  const idx = current.findIndex((x) => x.id === updatedImage.id);
  if (idx >= 0) {
    const oldUrl = current[idx].url;
    current[idx] = updatedImage;
    saveGameImages(current);

    if (oldUrl && oldUrl !== updatedImage.url) {
      const users = loadAllUsers();
      let usersChanged = false;
      users.forEach((u) => {
        if (u.avatar === oldUrl) {
          u.avatar = updatedImage.url;
          usersChanged = true;
        }
      });
      if (usersChanged) saveAllUsers(users);

      const cards = loadCards();
      let cardsChanged = false;
      cards.forEach((c) => {
        if (c.image === oldUrl) {
          c.image = updatedImage.url;
          cardsChanged = true;
        }
      });
      if (cardsChanged) saveCards(cards);
    }
  }
}

export function deleteGameImage(id: string): void {
  const current = loadGameImages();
  const target = current.find((x) => x.id === id);
  const updated = current.filter((x) => x.id !== id);
  saveGameImages(updated);

  if (target) {
    const fallbackAvatar = updated[0]?.url || '🤴';
    const users = loadAllUsers();
    let usersChanged = false;
    users.forEach((u) => {
      if (u.avatar === target.url) {
        u.avatar = fallbackAvatar;
        usersChanged = true;
      }
    });
    if (usersChanged) saveAllUsers(users);

    const cards = loadCards();
    let cardsChanged = false;
    cards.forEach((c) => {
      if (c.image === target.url) {
        c.image = null;
        cardsChanged = true;
      }
    });
    if (cardsChanged) saveCards(cards);
  }
}

export function resetDefaultGameImages(): GameAssetImage[] {
  saveGameImages(DEFAULT_GAME_IMAGES);
  return DEFAULT_GAME_IMAGES;
}

export const DEFAULT_CHESTS: ChestConfig[] = [
  {
    id: 'pack_bronze',
    title: 'صندوق چوبی برنز',
    description: 'شانس دریافت کارت‌های عادی و متوسط برای تقویت مقدماتی ارتش.',
    price: 150,
    currency: 'gold',
    icon: '📦',
    image: GAME_VISUALS.chestBronze,
    colorTheme: 'from-amber-800 to-stone-900 border-amber-700',
    cardCount: 1,
    tierRates: {
      normal: 65,
      medium: 25,
      legendary: 9,
      god: 1,
    },
    guaranteedTier: 'none',
    isAvailable: true,
  },
  {
    id: 'pack_silver',
    title: 'صندوق سیمین نقره',
    description: 'شامل ۲ کارت اساطیری با تضمین حداقل یک کارت باکیفیت متوسط یا بهتر.',
    price: 350,
    currency: 'gold',
    icon: '🥈',
    image: GAME_VISUALS.chestSilver,
    colorTheme: 'from-cyan-900 to-stone-900 border-cyan-500',
    cardCount: 2,
    tierRates: {
      normal: 35,
      medium: 40,
      legendary: 20,
      god: 5,
    },
    guaranteedTier: 'medium',
    isAvailable: true,
  },
  {
    id: 'pack_gold',
    title: 'صندوق زرین طلا',
    description: 'شامل ۳ کارت باشکوه با شانس بسیار بالا برای کارت‌های افسانه‌ای و شاهانه.',
    price: 800,
    currency: 'gold',
    icon: '👑',
    image: GAME_VISUALS.chestGold,
    colorTheme: 'from-amber-600 to-purple-950 border-amber-400',
    cardCount: 3,
    tierRates: {
      normal: 15,
      medium: 35,
      legendary: 35,
      god: 15,
    },
    guaranteedTier: 'legendary',
    isAvailable: true,
  },
  {
    id: 'pack_gems_royal',
    title: 'صندوق سلطنتی جواهرنشان',
    description: '۴ کارت درجه‌یک همراه با بالاترین شانس برای قهرمانان خداگونه (God Tier).',
    price: 25,
    currency: 'gems',
    icon: '💎',
    image: GAME_VISUALS.chestMythic,
    colorTheme: 'from-rose-600 via-purple-900 to-indigo-950 border-pink-500',
    cardCount: 4,
    tierRates: {
      normal: 10,
      medium: 30,
      legendary: 40,
      god: 20,
    },
    guaranteedTier: 'legendary',
    isAvailable: true,
  },
];

export function loadChestConfigs(): ChestConfig[] {
  try {
    const raw = localStorage.getItem(CHESTS_CONFIG_KEY);
    if (!raw) {
      saveChestConfigs(DEFAULT_CHESTS);
      return DEFAULT_CHESTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveChestConfigs(DEFAULT_CHESTS);
      return DEFAULT_CHESTS;
    }
    return parsed.map((c) => {
      let img = c.image;
      if (!img || img.includes('1791041168090') || img.includes('1791043023923') || img.includes('1791043037549') || img.includes('1791043050094')) {
        const id = (c.id || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        if (id.includes('bronze') || title.includes('برنز') || title.includes('چوب')) img = GAME_VISUALS.chestBronze;
        else if (id.includes('silver') || title.includes('نقره') || title.includes('سیمین')) img = GAME_VISUALS.chestSilver;
        else if (id.includes('royal') || id.includes('gems') || title.includes('سلطنتی') || title.includes('جواهر')) img = GAME_VISUALS.chestMythic;
        else img = GAME_VISUALS.chestGold;
      }
      return {
        ...c,
        image: img,
      };
    });
  } catch {
    return DEFAULT_CHESTS;
  }
}

export function saveChestConfigs(chests: ChestConfig[]): void {
  try {
    localStorage.setItem(CHESTS_CONFIG_KEY, JSON.stringify(chests));
  } catch (err) {
    console.error('Failed to save chest configs', err);
  }
}

export function pickCardByChestRates(
  cardLibrary: CardDef[],
  chest: ChestConfig,
  isGuaranteedSlot: boolean = false
): CardDef {
  if (cardLibrary.length === 0) {
    return FRESH_MYTHICAL_CARDS[0];
  }
  let targetTier: CardTier | null = null;
  if (isGuaranteedSlot && chest.guaranteedTier && chest.guaranteedTier !== 'none') {
    targetTier = chest.guaranteedTier;
  } else {
    const r = Math.random() * 100;
    const rates = chest.tierRates || { normal: 50, medium: 30, legendary: 15, god: 5 };
    if (r < rates.god) {
      targetTier = 'god';
    } else if (r < rates.god + rates.legendary) {
      targetTier = 'legendary';
    } else if (r < rates.god + rates.legendary + rates.medium) {
      targetTier = 'medium';
    } else {
      targetTier = 'normal';
    }
  }

  const pool = cardLibrary.filter((c) => c.tier === targetTier);
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return cardLibrary[Math.floor(Math.random() * cardLibrary.length)];
}

export function toggleUserBan(
  targetUserId: string,
  isBanned: boolean,
  banReason?: string
): { success: boolean; error?: string } {
  const users = loadAllUsers();
  const user = users.find((u) => u.id === targetUserId);
  if (!user) return { success: false, error: 'کاربر یافت نشد.' };
  user.isBanned = isBanned;
  user.banReason = isBanned ? (banReason?.trim() || 'نقض قوانین بازی') : '';
  saveAllUsers(users);
  return { success: true };
}

export function sendGiftToUser(
  targetUserId: string,
  giftData: {
    senderName: string;
    message: string;
    gold?: number;
    gems?: number;
    trophies?: number;
    cardIds?: string[];
  }
): { success: boolean; error?: string } {
  const users = loadAllUsers();
  const user = users.find((u) => u.id === targetUserId);
  if (!user) return { success: false, error: 'کاربر یافت نشد.' };

  const newGift: UserGift = {
    id: 'gift_' + Date.now() + Math.random().toString(36).substring(2, 5),
    senderName: giftData.senderName || 'مدیریت بازی',
    message: giftData.message || 'هدیه ویژه برای شما!',
    gold: Math.max(0, giftData.gold || 0),
    gems: Math.max(0, giftData.gems || 0),
    trophies: Math.max(0, giftData.trophies || 0),
    cardIds: giftData.cardIds || [],
    createdAt: Date.now(),
    claimed: false,
  };

  user.gifts = [newGift, ...(user.gifts || [])];
  saveAllUsers(users);
  return { success: true };
}

export function claimUserGift(
  userId: string,
  giftId: string
): { success: boolean; user?: UserProfile; error?: string } {
  const users = loadAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, error: 'کاربر یافت نشد.' };

  const gift = (user.gifts || []).find((g) => g.id === giftId);
  if (!gift || gift.claimed) {
    return { success: false, error: 'این هدیه قبلاً دریافت شده است.' };
  }

  if (gift.gold) user.gold += gift.gold;
  if (gift.gems) user.gems += gift.gems;
  if (gift.trophies) user.trophies = (user.trophies || 0) + gift.trophies;
  if (gift.cardIds && gift.cardIds.length > 0) {
    user.unlockedCardIds = Array.from(new Set([...user.unlockedCardIds, ...gift.cardIds]));
  }
  gift.claimed = true;
  saveAllUsers(users);
  return { success: true, user };
}

export function updateFullUserProfile(
  targetUserId: string,
  updates: Partial<UserProfile>
): { success: boolean; error?: string } {
  const users = loadAllUsers();
  const idx = users.findIndex((u) => u.id === targetUserId);
  if (idx < 0) return { success: false, error: 'کاربر یافت نشد.' };
  users[idx] = { ...users[idx], ...updates };
  saveAllUsers(users);
  return { success: true };
}

export function deleteUserAccount(targetUserId: string): boolean {
  const users = loadAllUsers();
  const filtered = users.filter((u) => u.id !== targetUserId);
  saveAllUsers(filtered);
  return true;
}

export const DEFAULT_EVENTS: GameEvent[] = [
  {
    id: 'event_weekly_wins_1',
    title: 'جام هفتگی دلاوران ایران',
    description: 'در نبردهای رنکد PvP پیروز شوید تا بیشترین برد را در این هفته ثبت کنید!',
    period: 'weekly',
    goalType: 'most_wins',
    icon: '🏆',
    image: GAME_VISUALS.eventWeeklyTrophy,
    bannerImage: GAME_VISUALS.eventsArenaBanner,
    startDate: Date.now() - 86400000 * 2,
    endDate: Date.now() + 86400000 * 5,
    isActive: true,
    claimedUserIds: [],
    rewards: [
      {
        rankFrom: 1,
        rankTo: 1,
        gold: 5000,
        gems: 250,
        cardIds: ['hero_rostam', 'hero_simurgh'],
        titleBadge: '👑 قهرمان هفتگی',
      },
      {
        rankFrom: 2,
        rankTo: 3,
        gold: 2500,
        gems: 120,
        cardIds: ['hero_arash'],
        titleBadge: '🥈 پهلوان نقره‌ای',
      },
      {
        rankFrom: 4,
        rankTo: 10,
        gold: 1000,
        gems: 50,
        cardIds: ['hero_kaveh'],
        titleBadge: '🥉 جنگجوی برتر',
      },
      {
        rankFrom: 11,
        rankTo: 50,
        gold: 400,
        gems: 15,
      },
    ],
  },
  {
    id: 'event_monthly_level_ups_1',
    title: 'ماراتن ماهانه ارتقای ارتش',
    description: 'کارت‌های قهرمانان خود را ارتقا دهید تا در رده‌بندی ماهانه صعود کنید!',
    period: 'monthly',
    goalType: 'most_level_ups',
    icon: '⚡',
    image: GAME_VISUALS.eventMonthlyFlame,
    bannerImage: GAME_VISUALS.eventsArenaBanner,
    startDate: Date.now() - 86400000 * 6,
    endDate: Date.now() + 86400000 * 24,
    isActive: true,
    claimedUserIds: [],
    rewards: [
      {
        rankFrom: 1,
        rankTo: 1,
        gold: 15000,
        gems: 600,
        cardIds: ['hero_rostam', 'hero_div_sepid'],
        titleBadge: '🌟 استاد اعظم ارتقا',
      },
      {
        rankFrom: 2,
        rankTo: 3,
        gold: 8000,
        gems: 300,
        cardIds: ['hero_simurgh'],
        titleBadge: '💎 فرمانده نخبه',
      },
      {
        rankFrom: 4,
        rankTo: 10,
        gold: 3500,
        gems: 120,
        cardIds: ['hero_arash'],
        titleBadge: '🛡️ پیشتاز میدان',
      },
      {
        rankFrom: 11,
        rankTo: 50,
        gold: 1200,
        gems: 40,
      },
    ],
  },
];

export function loadRawEvents(): GameEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      saveEvents(DEFAULT_EVENTS);
      return DEFAULT_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveEvents(DEFAULT_EVENTS);
      return DEFAULT_EVENTS;
    }
    return parsed;
  } catch {
    return DEFAULT_EVENTS;
  }
}

export function loadEvents(): GameEvent[] {
  checkAndDistributeEndedEvents();
  return loadRawEvents();
}

export function saveEvents(events: GameEvent[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events', err);
  }
}

export function createOrUpdateEvent(event: GameEvent): void {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) {
    events[idx] = event;
  } else {
    events.unshift(event);
  }
  saveEvents(events);
}

export function deleteEvent(eventId: string): boolean {
  const events = loadEvents();
  const filtered = events.filter((e) => e.id !== eventId);
  saveEvents(filtered);
  return true;
}

export function recordEventWin(userId: string): void {
  const users = loadAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  user.eventProgress = user.eventProgress || {};
  user.eventProgress['total_wins'] = (user.eventProgress['total_wins'] || 0) + 1;

  const events = loadEvents();
  for (const ev of events) {
    if (ev.isActive && ev.goalType === 'most_wins') {
      user.eventProgress[ev.id] = (user.eventProgress[ev.id] || 0) + 1;
    }
  }
  saveAllUsers(users);
}

export function recordEventLevelUp(userId: string, count: number = 1): void {
  const users = loadAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  user.eventProgress = user.eventProgress || {};
  user.eventProgress['total_level_ups'] = (user.eventProgress['total_level_ups'] || 0) + count;

  const events = loadEvents();
  for (const ev of events) {
    if (ev.isActive && ev.goalType === 'most_level_ups') {
      user.eventProgress[ev.id] = (user.eventProgress[ev.id] || 0) + count;
    }
  }
  saveAllUsers(users);
}

export function getEventUserScore(user: UserProfile, event: GameEvent): number {
  if (user.eventProgress && typeof user.eventProgress[event.id] === 'number') {
    return user.eventProgress[event.id];
  }
  if (event.goalType === 'most_wins') {
    if (user.id === 'user_admin') return 16;
    if (user.id === 'user_sohrab_champion') return 12;
    if (user.id === 'user_kaveh_smith') return 8;
    return user.wins || 0;
  } else {
    if (user.id === 'user_admin') return 9;
    if (user.id === 'user_sohrab_champion') return 7;
    if (user.id === 'user_kaveh_smith') return 5;
    return 1;
  }
}

export function getEventLeaderboard(
  event: GameEvent,
  allUsers: UserProfile[]
): { rank: number; user: UserProfile; score: number; reward?: EventReward }[] {
  const scored = allUsers.map((u) => ({
    user: u,
    score: getEventUserScore(u, event),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.user.trophies || 0) - (a.user.trophies || 0);
  });

  return scored.map((item, index) => {
    const rank = index + 1;
    const reward = event.rewards.find((r) => rank >= r.rankFrom && rank <= r.rankTo);
    return {
      rank,
      user: item.user,
      score: item.score,
      reward,
    };
  });
}

export function checkAndDistributeEndedEvents(): {
  settledEvents: GameEvent[];
  totalGiftsSent: number;
} {
  const events = loadRawEvents();
  const now = Date.now();
  let hasChanges = false;
  let totalGiftsSent = 0;
  const settledEvents: GameEvent[] = [];
  const users = loadAllUsers();

  for (const event of events) {
    if (event.isActive && now >= event.endDate && !event.isSettled) {
      const leaderboard = getEventLeaderboard(event, users);
      for (const entry of leaderboard) {
        if (entry.reward) {
          const userObj = users.find((u) => u.id === entry.user.id);
          if (userObj) {
            userObj.gifts = userObj.gifts || [];
            const alreadyHasGift = userObj.gifts.some((g) =>
              g.id.startsWith(`gift_event_${event.id}_`)
            );
            if (!alreadyHasGift) {
              const newGift: UserGift = {
                id: `gift_event_${event.id}_${userObj.id}_${Date.now()}`,
                senderName: `جوایز رویداد: ${event.title}`,
                message: `تبریک! شما در مسابقه ${event.title} رتبه ${entry.rank} را کسب کردید و جوایز به شما تعلق گرفت.`,
                gold: entry.reward.gold,
                gems: entry.reward.gems,
                cardIds: entry.reward.cardIds || [],
                createdAt: Date.now(),
                claimed: false,
              };
              userObj.gifts.unshift(newGift);
              totalGiftsSent++;
              if (entry.reward.titleBadge && !userObj.title) {
                userObj.title = entry.reward.titleBadge;
              }
            }
          }
        }
      }
      event.isSettled = true;
      event.settledAt = now;
      settledEvents.push(event);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveEvents(events);
    saveAllUsers(users);
  }

  return { settledEvents, totalGiftsSent };
}

export function manuallySettleEvent(eventId: string): {
  success: boolean;
  giftsSent: number;
  error?: string;
} {
  const events = loadRawEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) return { success: false, giftsSent: 0, error: 'رویداد یافت نشد.' };
  event.endDate = Date.now();
  event.isSettled = false;
  saveEvents(events);
  const res = checkAndDistributeEndedEvents();
  return { success: true, giftsSent: res.totalGiftsSent };
}

export function claimEventReward(
  userId: string,
  eventId: string
): { success: boolean; reward?: EventReward; user?: UserProfile; error?: string } {
  checkAndDistributeEndedEvents();
  const users = loadAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, error: 'کاربر یافت نشد.' };
  const events = loadRawEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) return { success: false, error: 'رویداد یافت نشد.' };
  const now = Date.now();
  if (now < event.endDate) {
    return {
      success: false,
      error: 'این رویداد هنوز به پایان نرسیده است.',
    };
  }

  return {
    success: true,
    user,
  };
}

export function getEventTimeRemaining(event: GameEvent): {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = Date.now();
  const diff = event.endDate - now;
  if (diff <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { totalMs: diff, days, hours, minutes, seconds, isExpired: false };
}

// ==========================================
// USD DOLLAR CURRENCY & DIRECT ADMIN CHAT
// ==========================================

const USD_REQUESTS_KEY = 'nabard_usd_requests_v1';

export const MIN_USD_DEPOSIT = 10;
export const MIN_USD_WITHDRAW = 20;

export const DEFAULT_USD_REQUESTS: UsdTransactionRequest[] = [
  {
    id: 'req_usd_101',
    userId: 'user_sohrab_champion',
    username: 'sohrab',
    displayName: 'سهراب یل',
    userAvatar: imgSohrab,
    type: 'deposit',
    amount: 50,
    status: 'completed',
    note: 'واریز ۵۰ دلار از طریق تتر USDT شبکه TRC20',
    adminNote: 'تایید شد و ۵۰ دلار به حساب منظور گردید.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2 + 1800000,
    messages: [
      {
        id: 'msg_u1',
        senderId: 'user_sohrab_champion',
        senderName: 'سهراب یل',
        senderRole: 'player',
        text: 'درود بر مدیر کل؛ مبلغ ۵۰ تتر به ولت دربار ارسال شد، شناسه تراکنش: 0x9b4...28f',
        timestamp: Date.now() - 86400000 * 2,
      },
      {
        id: 'msg_u2',
        senderId: 'user_admin',
        senderName: 'مهدی میرزاپور (مدیر کل)',
        senderRole: 'admin',
        text: 'درود پهلوان؛ تراکنش در بلاکچین تایید شد. ۵۰ دلار به موجودی کیف‌پول بازی شما شارژ گردید. پیروز باشید!',
        timestamp: Date.now() - 86400000 * 2 + 1800000,
      },
    ],
  },
  {
    id: 'req_usd_102',
    userId: 'user_player',
    username: 'player',
    displayName: 'پهلوان نوپا',
    userAvatar: imgRostam,
    type: 'deposit',
    amount: 15,
    status: 'pending',
    note: 'واریز ۱۵ دلار جهت خرید کارت دلاری در مزایده بازارچه',
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
    messages: [
      {
        id: 'msg_u3',
        senderId: 'user_player',
        senderName: 'پهلوان نوپا',
        senderRole: 'player',
        text: 'سلام خسته نباشید، من فیش واریز معادل ۱۵ دلار رو پرداخت کردم، لطفاً حسابم رو شارژ کنید تا بتونم کارت مزایده رو بخرم.',
        timestamp: Date.now() - 3600000 * 3,
      },
    ],
  },
  {
    id: 'req_usd_103',
    userId: 'user_arash_archer',
    username: 'arash',
    displayName: 'آرش کماندار',
    userAvatar: imgArash,
    type: 'withdraw',
    amount: 25,
    status: 'pending',
    note: 'برداشت ۲۵ دلار از فروش کارت به آدرس ولت USDT TRC20: TLa9...Kz7',
    createdAt: Date.now() - 3600000 * 1,
    updatedAt: Date.now() - 3600000 * 1,
    messages: [
      {
        id: 'msg_u4',
        senderId: 'user_arash_archer',
        senderName: 'آرش کماندار',
        senderRole: 'player',
        text: 'سلام جناب میرزاپور عزیز، کارتم در مزایده با دلار فروش رفته و درخواست برداشت ۲۵ دلار دارم. ممنون میشم واریز بفرمایید.',
        timestamp: Date.now() - 3600000 * 1,
      },
    ],
  },
];

export function loadUsdRequests(): UsdTransactionRequest[] {
  try {
    const raw = localStorage.getItem(USD_REQUESTS_KEY);
    if (!raw) {
      saveUsdRequests(DEFAULT_USD_REQUESTS);
      return DEFAULT_USD_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveUsdRequests(DEFAULT_USD_REQUESTS);
      return DEFAULT_USD_REQUESTS;
    }
    return parsed;
  } catch {
    return DEFAULT_USD_REQUESTS;
  }
}

export function saveUsdRequests(reqs: UsdTransactionRequest[]): void {
  try {
    localStorage.setItem(USD_REQUESTS_KEY, JSON.stringify(reqs));
  } catch (err) {
    console.error('Failed to save USD requests', err);
  }
}

export function createUsdRequest(
  user: UserProfile,
  type: UsdTransactionType,
  amount: number,
  initialNote?: string
): { success: boolean; request?: UsdTransactionRequest; error?: string } {
  if (type === 'deposit') {
    if (amount < MIN_USD_DEPOSIT) {
      return { success: false, error: `حداقل مبلغ شارژ حساب ${MIN_USD_DEPOSIT} دلار است.` };
    }
  } else if (type === 'withdraw') {
    if (amount < MIN_USD_WITHDRAW) {
      return { success: false, error: `حداقل مبلغ برداشت ${MIN_USD_WITHDRAW} دلار است.` };
    }
    if ((user.usd || 0) < amount) {
      return { success: false, error: `موجودی دلار شما کافی نیست. ($${user.usd || 0})` };
    }
    // Pre-deduct user's USD for withdrawal security
    const updatedUser: UserProfile = {
      ...user,
      usd: (user.usd || 0) - amount,
    };
    updateUserProfile(updatedUser);
  }

  const typeTitle =
    type === 'deposit'
      ? `درخواست واریز و شارژ ${amount}$`
      : type === 'withdraw'
      ? `درخواست برداشت وجه ${amount}$`
      : 'پشتیبانی و تضمین معامله دلاری';

  const newReq: UsdTransactionRequest = {
    id: 'req_usd_' + Date.now(),
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    userAvatar: user.avatar,
    type,
    amount,
    status: 'pending',
    note: initialNote || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [
      {
        id: 'msg_' + Date.now(),
        senderId: user.id,
        senderName: user.displayName,
        senderRole: user.role,
        text: initialNote || `${typeTitle} توسط کاربر ثبت شد.`,
        timestamp: Date.now(),
      },
    ],
  };

  const allReqs = loadUsdRequests();
  allReqs.unshift(newReq);
  saveUsdRequests(allReqs);
  return { success: true, request: newReq };
}

export function sendUsdChatMessage(
  requestId: string,
  sender: UserProfile,
  text: string,
  attachmentImage?: string
): boolean {
  if (!text.trim()) return false;
  const reqs = loadUsdRequests();
  const req = reqs.find((r) => r.id === requestId);
  if (!req) return false;

  const newMsg: UsdChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    senderId: sender.id,
    senderName: sender.displayName,
    senderRole: sender.role,
    text: text.trim(),
    timestamp: Date.now(),
    attachmentImage,
  };

  req.messages.push(newMsg);
  req.updatedAt = Date.now();
  saveUsdRequests(reqs);
  return true;
}

export function approveUsdRequest(
  requestId: string,
  adminUser: UserProfile,
  adminNote?: string
): { success: boolean; error?: string } {
  if (adminUser.role !== 'admin') {
    return { success: false, error: 'فقط مدیر کل مجاز به تایید تراکنش‌های دلاری است.' };
  }
  const reqs = loadUsdRequests();
  const req = reqs.find((r) => r.id === requestId);
  if (!req) return { success: false, error: 'درخواست یافت نشد.' };
  if (req.status === 'completed') return { success: false, error: 'این درخواست قبلاً تایید و نهایی شده است.' };

  const allUsers = loadAllUsers();
  const targetUser = allUsers.find((u) => u.id === req.userId);

  if (req.type === 'deposit') {
    if (targetUser) {
      targetUser.usd = (targetUser.usd || 0) + req.amount;
      saveAllUsers(allUsers);
    }
  }

  req.status = 'completed';
  req.adminNote = adminNote || 'تایید و تسویه شد.';
  req.updatedAt = Date.now();

  req.messages.push({
    id: 'msg_sys_' + Date.now(),
    senderId: adminUser.id,
    senderName: 'مهدی میرزاپور (مدیر کل)',
    senderRole: 'admin',
    text: `✅ تایید شد: درخواست ${req.type === 'deposit' ? 'شارژ' : 'تسویه برداشت'} به مبلغ $${req.amount} توسط مدیریت تایید و نهایی گردید. ${adminNote ? `(توضیح: ${adminNote})` : ''}`,
    timestamp: Date.now(),
  });

  saveUsdRequests(reqs);
  return { success: true };
}

export function rejectUsdRequest(
  requestId: string,
  adminUser: UserProfile,
  reason: string
): { success: boolean; error?: string } {
  if (adminUser.role !== 'admin') {
    return { success: false, error: 'فقط مدیر کل مجاز به رد تراکنش است.' };
  }
  const reqs = loadUsdRequests();
  const req = reqs.find((r) => r.id === requestId);
  if (!req) return { success: false, error: 'درخواست یافت نشد.' };
  if (req.status === 'completed') return { success: false, error: 'درخواست تسویه شده را نمی‌توان لغو کرد.' };

  if (req.type === 'withdraw' && req.status !== 'rejected') {
    const allUsers = loadAllUsers();
    const targetUser = allUsers.find((u) => u.id === req.userId);
    if (targetUser) {
      targetUser.usd = (targetUser.usd || 0) + req.amount;
      saveAllUsers(allUsers);
    }
  }

  req.status = 'rejected';
  req.adminNote = reason;
  req.updatedAt = Date.now();

  req.messages.push({
    id: 'msg_sys_' + Date.now(),
    senderId: adminUser.id,
    senderName: 'مهدی میرزاپور (مدیر کل)',
    senderRole: 'admin',
    text: `❌ درخواست به مبلغ $${req.amount} رد شد. دلیل: ${reason}`,
    timestamp: Date.now(),
  });

  saveUsdRequests(reqs);
  return { success: true };
}

export function adminAdjustUserUsd(
  userId: string,
  deltaAmount: number,
  reason: string
): { success: boolean; newBalance?: number; error?: string } {
  const allUsers = loadAllUsers();
  const target = allUsers.find((u) => u.id === userId);
  if (!target) return { success: false, error: 'کاربر مورد نظر یافت نشد.' };

  const current = target.usd || 0;
  const next = Math.max(0, current + deltaAmount);
  target.usd = next;
  saveAllUsers(allUsers);
  return { success: true, newBalance: next };
}

// ==========================================
// GLOBAL CHAT & INTER-CLAN DIPLOMACY CHAT
// ==========================================

const GLOBAL_CHAT_KEY = 'nabard_global_chat_v2';

export const DEFAULT_GLOBAL_MESSAGES: GlobalChatMessage[] = [
  {
    id: 'msg_g_1',
    senderId: 'user_admin',
    senderName: 'مهدی میرزاپور (مدیر کل)',
    senderAvatar: imgRostam,
    senderRole: 'admin',
    senderLevel: 10,
    senderTrophies: 2850,
    clanName: 'دلاوران ایران‌زمین',
    clanBadge: '🦁',
    text: 'درود بر تمامی پهلوانان و فرماندهان دربار شاهنامه! به تالار گفتگوی جهانی خوش آمدید. برای راهنمای کامل بازی، دکمه آموزش 🎓 را مشاهده کنید.',
    timestamp: Date.now() - 3600000 * 12,
    channel: 'global',
    type: 'system',
  },
  {
    id: 'msg_g_2',
    senderId: 'user_sohrab_champion',
    senderName: 'سهراب یل',
    senderAvatar: imgSohrab,
    senderRole: 'player',
    senderLevel: 7,
    senderTrophies: 1680,
    clanName: 'دلاوران ایران‌زمین',
    clanBadge: '🦁',
    text: 'کسی از پهلوانان حاضر هست یک نبرد رنک دوستانه انجام بدیم؟ کارت رستم من ارتقا پیدا کرده!',
    timestamp: Date.now() - 3600000 * 3,
    channel: 'global',
    type: 'chat',
  },
  {
    id: 'msg_g_3',
    senderId: 'user_arash_archer',
    senderName: 'آرش کماندار',
    senderAvatar: imgArash,
    senderRole: 'player',
    senderLevel: 5,
    senderTrophies: 1150,
    clanName: 'فرقه سیمرغ البرز',
    clanBadge: '🦅',
    text: 'یک کارت افسونگر با لول بالا در بازارچه حراجی به قیمت ۱۰ دلار قرار دادم. دوستان نگاهی بندازید.',
    timestamp: Date.now() - 3600000 * 1,
    channel: 'global',
    type: 'card_share',
    cardShare: {
      cardId: FRESH_MYTHICAL_CARDS[2].id,
      cardName: FRESH_MYTHICAL_CARDS[2].name,
      cardLevel: 3,
      cardType: FRESH_MYTHICAL_CARDS[2].type,
    },
  },
  {
    id: 'msg_ic_1',
    senderId: 'user_admin',
    senderName: 'مهدی میرزاپور (سلطان)',
    senderAvatar: imgRostam,
    senderRole: 'admin',
    senderLevel: 10,
    senderTrophies: 2850,
    clanName: 'دلاوران ایران‌زمین',
    clanBadge: '🦁',
    text: '⚔️ اعلامیه دیپلماسی: اتحادیه «دلاوران ایران‌زمین» آماده برگزاری دوئل‌های دوستانه با سایر کلن‌هاست.',
    timestamp: Date.now() - 3600000 * 8,
    channel: 'inter_clan',
    type: 'system',
  },
  {
    id: 'msg_ic_2',
    senderId: 'user_arash_archer',
    senderName: 'آرش کماندار (سلطان)',
    senderAvatar: imgArash,
    senderRole: 'player',
    senderLevel: 5,
    senderTrophies: 1150,
    clanName: 'فرقه سیمرغ البرز',
    clanBadge: '🦅',
    text: 'درود بر سلطان رستم؛ اعضای کلن سیمرغ آماده پذیرش چالش هستند. پرچم اتحادیه ما در البرز برافراشته است!',
    timestamp: Date.now() - 3600000 * 2,
    channel: 'inter_clan',
    type: 'duel_challenge',
  },
];

export function loadGlobalMessages(): GlobalChatMessage[] {
  try {
    const raw = localStorage.getItem(GLOBAL_CHAT_KEY);
    if (!raw) {
      saveGlobalMessages(DEFAULT_GLOBAL_MESSAGES);
      return DEFAULT_GLOBAL_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveGlobalMessages(DEFAULT_GLOBAL_MESSAGES);
      return DEFAULT_GLOBAL_MESSAGES;
    }
    return parsed;
  } catch {
    return DEFAULT_GLOBAL_MESSAGES;
  }
}

export function saveGlobalMessages(msgs: GlobalChatMessage[]): void {
  try {
    localStorage.setItem(GLOBAL_CHAT_KEY, JSON.stringify(msgs));
  } catch (err) {
    console.error('Failed to save global messages', err);
  }
}

export function sendGlobalChatMessage(
  sender: UserProfile,
  text: string,
  channel: ChatChannel,
  extra?: Partial<GlobalChatMessage>
): GlobalChatMessage | null {
  if (!text.trim() && !extra?.type) return null;
  const clanList = loadClans();
  const userClan = sender.clanId ? clanList.find((c) => c.id === sender.clanId) : null;

  const newMsg: GlobalChatMessage = {
    id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    senderId: sender.id,
    senderName: sender.displayName,
    senderAvatar: sender.avatar,
    senderRole: sender.role,
    senderLevel: sender.level || 1,
    senderTrophies: sender.trophies || 150,
    clanName: userClan ? userClan.name : undefined,
    clanBadge: userClan ? userClan.badge : undefined,
    text: text.trim(),
    timestamp: Date.now(),
    channel,
    type: extra?.type || 'chat',
    challengeDetails: extra?.challengeDetails,
    cardShare: extra?.cardShare,
  };

  const msgs = loadGlobalMessages();
  msgs.push(newMsg);
  // Keep last 150 messages
  const trimmed = msgs.slice(-150);
  saveGlobalMessages(trimmed);
  return newMsg;
}

// ==========================================
// TUTORIAL COMPLETION & REWARD CLAIM
// ==========================================

export function markTutorialCompleted(user: UserProfile): UserProfile {
  const updated: UserProfile = {
    ...user,
    completedTutorial: true,
  };
  updateUserProfile(updated);
  return updated;
}

export function claimTutorialReward(user: UserProfile): {
  success: boolean;
  updatedUser: UserProfile;
  rewardText: string;
} {
  const rewardGold = 750;
  const rewardGems = 40;

  const updated: UserProfile = {
    ...user,
    gold: (user.gold || 0) + rewardGold,
    gems: (user.gems || 0) + rewardGems,
    completedTutorial: true,
    hasClaimedTutorialReward: true,
  };

  updateUserProfile(updated);
  return {
    success: true,
    updatedUser: updated,
    rewardText: `${rewardGold} سکه طلا 💰 + ${rewardGems} الماس جادویی 💎`,
  };
}
