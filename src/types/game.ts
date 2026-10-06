export type CardType = 'attacker' | 'defender' | 'mage' | 'king' | 'spell' | 'god' | 'both';
export type CardTier = 'normal' | 'medium' | 'legendary' | 'god';
export type UserRole = 'admin' | 'player';
export type BattleMode = 'pvp_ranked' | 'pvp_friendly' | 'bot' | 'campaign';
export type BotDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'champion';

export interface LeagueDef {
  id: LeagueTier;
  name: string;
  minTrophies: number;
  maxTrophies: number;
  icon: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  rewardGoldPerWin: number;
  description: string;
}

export const LEAGUES: LeagueDef[] = [
  {
    id: 'bronze',
    name: 'لیگ برنز (پایین‌رتبه)',
    minTrophies: 0,
    maxTrophies: 299,
    icon: '🥉',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-950/60 border-amber-800',
    borderColor: 'border-amber-800',
    rewardGoldPerWin: 50,
    description: 'میدان آزمون جنگجویان نوپا',
  },
  {
    id: 'silver',
    name: 'لیگ نقره (مدافعان)',
    minTrophies: 300,
    maxTrophies: 599,
    icon: '🥈',
    color: 'text-slate-300',
    badgeBg: 'bg-slate-900/80 border-slate-400',
    borderColor: 'border-slate-400',
    rewardGoldPerWin: 85,
    description: 'عرصه مبارزه فرماندهان باتجربه',
  },
  {
    id: 'gold',
    name: 'لیگ طلا (پهلوانان)',
    minTrophies: 600,
    maxTrophies: 999,
    icon: '🥇',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/80 border-amber-400',
    borderColor: 'border-amber-400',
    rewardGoldPerWin: 140,
    description: 'نبرد قهرمانان نامدار ایران‌زمین',
  },
  {
    id: 'platinum',
    name: 'لیگ پلاتین (دلاوران اساطیری)',
    minTrophies: 1000,
    maxTrophies: 1499,
    icon: '💎',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/80 border-cyan-400',
    borderColor: 'border-cyan-400',
    rewardGoldPerWin: 220,
    description: 'میدان رقابت استادان رزم و تاکتیک',
  },
  {
    id: 'diamond',
    name: 'لیگ الماس (جاودانگان)',
    minTrophies: 1500,
    maxTrophies: 2199,
    icon: '👑',
    color: 'text-purple-300',
    badgeBg: 'bg-purple-950/80 border-purple-400',
    borderColor: 'border-purple-400',
    rewardGoldPerWin: 320,
    description: 'نبرد نخبگان و پادشاهان بی‌پایان',
  },
  {
    id: 'champion',
    name: 'لیگ اسطوره‌ها (تخت جمشید)',
    minTrophies: 2200,
    maxTrophies: 99999,
    icon: '🌟',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-950/80 border-rose-500',
    borderColor: 'border-rose-500',
    rewardGoldPerWin: 500,
    description: 'جایگاه اساطیر فناناپذیر تاریخ',
  },
];

export function getLeagueByTrophies(trophies: number = 0): LeagueDef {
  const safeTrophies = Math.max(0, trophies || 0);
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (safeTrophies >= LEAGUES[i].minTrophies) {
      return LEAGUES[i];
    }
  }
  return LEAGUES[0];
}

export interface CardProgress {
  wins: number;
  xp: number;
  level: number;
}

export interface GameAssetImage {
  id: string;
  name: string;
  url: string;
  category: 'heroes' | 'kings' | 'mages' | 'creatures' | 'custom';
  createdAt: number;
  isCustom?: boolean;
}

export type ClanRole = 'sultan' | 'elder' | 'member';
export type EventPeriod = 'weekly' | 'monthly';
export type EventGoalType = 'most_wins' | 'most_level_ups';

export interface EventReward {
  rankFrom: number;
  rankTo: number;
  gold: number;
  gems: number;
  cardIds?: string[];
  titleBadge?: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  period: EventPeriod;
  goalType: EventGoalType;
  icon: string;
  image?: string;
  bannerImage?: string;
  startDate: number;
  endDate: number;
  rewards: EventReward[];
  isActive: boolean;
  claimedUserIds?: string[];
  isSettled?: boolean;
  settledAt?: number;
}

export interface UserGift {
  id: string;
  senderName: string;
  message: string;
  gold?: number;
  gems?: number;
  trophies?: number;
  cardIds?: string[];
  createdAt: number;
  claimed?: boolean;
}

export interface ChestTierRate {
  normal: number;
  medium: number;
  legendary: number;
  god: number;
}

export interface ChestConfig {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'gold' | 'gems';
  icon: string;
  image?: string;
  colorTheme: string;
  cardCount: number;
  tierRates: ChestTierRate;
  guaranteedTier?: CardTier | 'none';
  isAvailable: boolean;
}

export interface ClanMember {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  role: ClanRole;
  trophies: number;
  level: number;
  donations: number;
  joinedAt: number;
}

export interface ClanMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: ClanRole;
  text: string;
  timestamp: number;
  type?: 'chat' | 'system' | 'duel_request';
}

export type ClanJoinType = 'open' | 'invite_only' | 'closed';

export interface ClanJoinRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  trophies: number;
  level: number;
  requestedAt: number;
}

export interface ClanDef {
  id: string;
  name: string;
  description: string;
  badge: string;
  crestImage?: string;
  bannerImage?: string;
  sultanId: string;
  sultanName: string;
  requiredTrophies: number;
  requiredLevel?: number;
  joinType?: ClanJoinType;
  joinRequests?: ClanJoinRequest[];
  isClosed?: boolean;
  members: ClanMember[];
  level: number;
  totalTrophies: number;
  createdAt: number;
  messages: ClanMessage[];
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  title?: string;
  password?: string;
  role: UserRole;
  level: number;
  xp: number;
  gold: number;
  gems: number;
  usd: number;
  trophies: number;
  wins: number;
  losses: number;
  totalDamage: number;
  unlockedCardIds: string[];
  activeDeck: (string | null)[][];
  cardProgress: Record<string, CardProgress>;
  campaignCompletedIndex: number;
  avatar: string;
  createdAt: number;
  lastLogin: number;
  clanId?: string | null;
  clanRole?: ClanRole | null;
  lastClanLeaveTimestamp?: number | null;
  isBanned?: boolean;
  banReason?: string;
  gifts?: UserGift[];
  eventProgress?: Record<string, number>;
  completedTutorial?: boolean;
  hasClaimedTutorialReward?: boolean;
}

export type ChatChannel = 'global' | 'inter_clan';

export interface GlobalChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  senderLevel: number;
  senderTrophies: number;
  clanName?: string;
  clanBadge?: string;
  text: string;
  timestamp: number;
  channel: ChatChannel;
  type?: 'chat' | 'duel_challenge' | 'system' | 'card_share';
  challengeDetails?: {
    targetUserId?: string;
    wagerGold?: number;
    isAccepted?: boolean;
  };
  cardShare?: {
    cardId: string;
    cardName: string;
    cardLevel: number;
    cardType: string;
    cardImage?: string | null;
  };
}

export interface CardSounds {
  start?: string | null;
  attack?: string | null;
  death?: string | null;
}

export interface CardPassives {
  doubleStrike: boolean;
  cleave: boolean;
  crit: number;
  resurrect: number;
  lastStand: boolean;
  regen: number;
  berserk: number;
  rage: number;
  pierce: boolean;
  ignoreGuard: boolean;
  stealth: boolean;
  [key: string]: boolean | number;
}

export type AbilityPhase = 'onStart' | 'onTurnStart' | 'onAttack' | 'onDefend' | 'onKill' | 'onDeath';

export interface CardAbility {
  id?: string;
  action: string;
  label: string;
  icon: string;
  amount: number;
  targetSide: 'ally' | 'enemy';
  positions: [number, number][];
  targetCriteria?: 'all' | 'random' | 'lowestHp' | 'highestAtk';
  chancePercent?: number;
}

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  tier: CardTier;
  attack: number;
  health: number;
  icon: string;
  image?: string | null;
  borderColor: string;
  aura?: 'none' | 'fire' | 'magic' | 'gold' | 'ice' | 'lightning';
  sounds?: CardSounds;
  passives: CardPassives;
  abilities: Record<AbilityPhase, CardAbility[]>;
  description?: string;
  shopPrice?: number;
  createdBy?: string;
}

export interface StageDef {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  rewardGold: number;
  rewardXp: number;
  enemyFormation: (CardDef | null)[][];
  isCustom?: boolean;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  card: CardDef;
  cardLevel: number;
  type: 'direct' | 'auction';
  currency?: 'gold' | 'usd';
  price: number;
  currentBid: number;
  highestBidderId?: string;
  highestBidderName?: string;
  bidsCount: number;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'sold' | 'expired';
}

export type UsdTransactionType = 'deposit' | 'withdraw' | 'trade_support';

export interface UsdChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
  attachmentImage?: string;
}

export interface UsdTransactionRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  userAvatar: string;
  type: UsdTransactionType;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  note?: string;
  adminNote?: string;
  createdAt: number;
  updatedAt: number;
  messages: UsdChatMessage[];
}

export interface BattlePageConfig {
  titleText: string;
  titleColor: string;
  bgImage: string | null;
  bgColor: string;
  boardTexture: string;
  borderColor: string;
  dividerText: string;
  dividerColor: string;
  endTurnBtnText: string;
  endTurnBtnBg: string;
  endTurnBtnColor: string;
  weatherEffect: string;
}

export interface CampaignPageConfig {
  titleText: string;
  titleColor: string;
  subtitleText: string;
  bgImage: string | null;
  bgColor: string;
  cardBgColor: string;
  cardBorderColor: string;
  startBtnText: string;
  startBtnBg: string;
}

export interface DeckPageConfig {
  titleText: string;
  titleColor: string;
  subtitleText: string;
  bgImage: string | null;
  bgColor: string;
  slotBorderColor: string;
  saveBtnText: string;
  saveBtnBg: string;
}

export interface ShopPageConfig {
  titleText: string;
  titleColor: string;
  subtitleText: string;
  bgImage: string | null;
  bgColor: string;
  shopkeeperName: string;
  bannerText: string;
  pack1Name: string;
  pack2Name: string;
  pack3Name: string;
}

export interface AllPagesConfig {
  battlePage: BattlePageConfig;
  campaignPage: CampaignPageConfig;
  deckPage: DeckPageConfig;
  shopPage: ShopPageConfig;
}

export interface CombatCardRuntime extends CardDef {
  currentHealth: number;
  currentAttack: number;
  maxHealth: number;
  cardLevel: number;
  isPlayer: boolean;
  hasAttacked: boolean;
  thorns: number;
  shield: number;
  poison: number;
  burn: number;
  dodge: number;
  taunt: boolean;
  silenced: boolean;
  frozen: boolean;
  dead: boolean;
  lastStandUsed: boolean;
  resurrectUsed: boolean;
  boardRow: number;
  boardCol: number;
}

export interface AuthScreenConfig {
  bgImage: string;
  overlayDarkness: number; // 0-100
  title: string;
  subtitle: string;
  loginButtonText: string;
  registerButtonText: string;
  buttonIcon: string;
  buttonBannerImage?: string;
  badgeGlow: string;
}
