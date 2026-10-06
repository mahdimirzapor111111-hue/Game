import React, { useState, useRef } from 'react';
import { CardDef, CardType } from '../types/game';

export interface CardViewProps {
  card: CardDef;
  isPlayer?: boolean;
  currentHealth?: number;
  currentAttack?: number;
  maxHealth?: number;
  cardLevel?: number;
  canAttack?: boolean;
  isSelected?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
  isDying?: boolean;
  isFrozen?: boolean;
  isSilenced?: boolean;
  shield?: number;
  thorns?: number;
  poison?: number;
  burn?: number;
  dodge?: number;
  taunt?: boolean;
  onClick?: () => void;
  onHold?: () => void;
  className?: string;
  compact?: boolean;
}

export const TYPE_NAMES: Record<CardType, string> = {
  king: 'پادشاه',
  mage: 'افسونگر',
  attacker: 'تازشگر',
  defender: 'پاسدار',
  spell: 'افسون',
  god: 'خدا',
  both: 'دوطرفه',
};

export const TYPE_COLORS: Record<CardType, string> = {
  king: 'bg-amber-600 text-stone-950 font-bold',
  mage: 'bg-purple-700 text-white',
  attacker: 'bg-red-700 text-white',
  defender: 'bg-blue-700 text-white',
  spell: 'bg-emerald-700 text-white',
  god: 'bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 text-stone-950 font-black',
  both: 'bg-teal-700 text-white',
};

export const PASSIVE_INFO: Record<string, { icon: string; name: string; desc: string }> = {
  doubleStrike: { icon: '🗡️', name: 'حمله دوگانه', desc: 'در هر بار حمله، ۲ بار ضربه پی‌درپی می‌زند.' },
  cleave: { icon: '🪓', name: 'برش جانبی', desc: 'کارت‌های کناری هدف نیز نصف آسیب را دریافت می‌کنند.' },
  crit: { icon: '💥', name: 'ضربه بحرانی', desc: 'شانس وارد کردن آسیب ۲ برابری دارد.' },
  resurrect: { icon: '👼', name: 'رستاخیز اساطیری', desc: 'پس از مرگ، یک‌بار با درصدی از سلامتی بازمی‌گردد.' },
  lastStand: { icon: '💪', name: 'جان سخت', desc: 'اولین ضربه مرگبار را با ۱ جان مقاومت می‌کند.' },
  regen: { icon: '💚', name: 'بازسازی خودکار', desc: 'در شروع هر نوبت، مقدار معینی جان بازمی‌یابد.' },
  berserk: { icon: '😤', name: 'خشم نبرد', desc: 'با هر بار ضربه خوردن، به قدرت حمله کارت افزوده می‌شود.' },
  rage: { icon: '🔥', name: 'خشم پیوسته', desc: 'در شروع هر نوبت صاحبش، قدرت حمله کارت بیشتر می‌شود.' },
  pierce: { icon: '⚡', name: 'زره‌شکن', desc: 'سپر دفاعی هدف را دور زده و مستقیم به جان ضربه می‌زند.' },
  ignoreGuard: { icon: '🏹', name: 'تک‌تیرانداز', desc: 'پاسدارها و تحریک‌های دشمن را نادیده گرفته و هر هدفی را می‌زند.' },
  stealth: { icon: '👻', name: 'استتار تاریکی', desc: 'تا زمانی که یاران دیگری زنده هستند، قابل هدف‌گیری مستقیم نیست.' },
};

export const PHASE_NAMES: Record<string, string> = {
  onStart: '🌟 شروع بازی',
  onTurnStart: '🔄 شروع نوبت',
  onAttack: '⚔️ هنگام حمله',
  onDefend: '🛡️ هنگام دفاع',
  onKill: '🎯 هنگام کشتن',
  onDeath: '💀 بعد از مرگ',
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  currentHealth,
  currentAttack,
  maxHealth,
  cardLevel,
  canAttack,
  isSelected,
  isAttacking,
  isHit,
  isDying,
  isFrozen,
  isSilenced,
  shield = 0,
  thorns = 0,
  poison = 0,
  burn = 0,
  dodge = 0,
  taunt = false,
  onClick,
  onHold,
  className = '',
  compact = false,
}) => {
  const [internalInspectOpen, setInternalInspectOpen] = useState(false);
  const timerRef = useRef<any>(null);
  const isLongPressRef = useRef<boolean>(false);

  const hp = currentHealth !== undefined ? currentHealth : card.health;
  const mxHp = maxHealth !== undefined ? maxHealth : card.health;
  const atk = currentAttack !== undefined ? currentAttack : card.attack;

  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, mxHp)) * 100)));
  const hpBarColor =
    hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-600';

  const borderColor = card.borderColor || '#ffb300';
  const auraClass =
    card.aura === 'fire'
      ? 'shadow-lg shadow-orange-500/70 ring-2 ring-orange-400'
      : card.aura === 'magic'
      ? 'shadow-lg shadow-purple-500/70 ring-2 ring-purple-400'
      : card.aura === 'gold'
      ? 'shadow-lg shadow-amber-400/80 ring-2 ring-amber-300 animate-pulse'
      : card.aura === 'ice'
      ? 'shadow-lg shadow-cyan-400/70 ring-2 ring-cyan-300'
      : card.aura === 'lightning'
      ? 'shadow-lg shadow-yellow-300/80 ring-2 ring-yellow-400'
      : '';

  const tierClass =
    card.tier === 'god'
      ? 'border-4 tier-god shadow-amber-500/50'
      : card.tier === 'legendary'
      ? 'border-2 shadow-amber-400/40 ring-1 ring-amber-300'
      : card.tier === 'medium'
      ? 'border-2'
      : 'border';

  const totalAbilities = card.abilities
    ? Object.values(card.abilities).reduce((acc, list) => acc + (list ? list.length : 0), 0)
    : 0;

  const hasCustomSounds = !!(card.sounds?.start || card.sounds?.attack || card.sounds?.death);
  const cardWidth = compact ? 'w-14 h-20' : 'w-16 h-24 sm:w-20 sm:h-28';

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {}
      }
      if (onHold) {
        onHold();
      } else {
        setInternalInspectOpen(true);
      }
    }, 420);
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.stopPropagation();
      e.preventDefault();
      isLongPressRef.current = false;
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onHold) {
      onHold();
    } else {
      setInternalInspectOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onContextMenu={handleContextMenu}
        style={{
          ['--cb' as any]: borderColor,
          borderColor: borderColor,
        }}
        className={`relative select-none rounded-xl bg-stone-900 text-stone-100 flex flex-col justify-between overflow-visible transition-all duration-200 cursor-pointer shadow-lg group ${cardWidth} ${tierClass} ${auraClass} ${
          canAttack && !isFrozen ? 'card-can-attack' : ''
        } ${isSelected ? 'selected' : ''} ${isAttacking ? 'z-50 pointer-events-none' : ''} ${
          isHit ? 'card-hit' : ''
        } ${isDying ? 'card-dying' : ''} ${className}`}
        title="کلیک برای انتخاب | نگه داشتن برای مشاهده جزئیات"
      >
        {/* ================= 1. FULL-BLEED CHARACTER ART (COVERS 100% OF CARD) ================= */}
        <div className="absolute inset-0 w-full h-full rounded-[10px] overflow-hidden pointer-events-none">
          {card.image ? (
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-amber-950 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] filter">
                {card.icon || '⚔️'}
              </span>
            </div>
          )}

          {/* Top Vignette for Level & Type Readability */}
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />

          {/* Bottom Vignette for Name & Stats Readability */}
          <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent pointer-events-none" />
        </div>

        {/* ================= 2. TOP-RIGHT: CARD TYPE BADGE ================= */}
        <div className="absolute top-1 right-1 z-20 flex gap-0.5 pointer-events-none">
          <span
            className={`text-[7.5px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-bold leading-tight shadow-md border border-white/20 backdrop-blur-[2px] ${
              TYPE_COLORS[card.type] || 'bg-stone-700 text-white'
            }`}
          >
            {TYPE_NAMES[card.type] || card.type}
          </span>
        </div>

        {/* ================= 3. TOP-LEFT: LEVEL BADGE & KING CROWN ================= */}
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 pointer-events-none">
          {card.type === 'king' && (
            <span className="text-[11px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-none">
              👑
            </span>
          )}
          {cardLevel !== undefined && (
            <span
              className={`text-[7.5px] sm:text-[8.5px] font-black px-1.5 py-0.5 rounded-md shadow-md border leading-tight ${
                cardLevel > 1
                  ? 'bg-amber-400 text-stone-950 border-amber-200 shadow-amber-500/40 ring-1 ring-amber-300'
                  : 'bg-stone-950/85 text-stone-200 border-stone-600'
              }`}
              title={`سطح کارت: ${cardLevel}`}
            >
              L.{cardLevel}
            </span>
          )}
          {hasCustomSounds && (
            <span className="text-[8px] text-amber-300 drop-shadow ml-0.5">🔊</span>
          )}
        </div>

        {/* ================= 4. FLOATING STATUS EFFECTS & BUFFS ================= */}
        <div className="absolute bottom-6 sm:bottom-7 inset-x-1 z-20 flex flex-wrap items-center justify-center gap-0.5 pointer-events-none">
          {shield > 0 && (
            <span className="text-[7px] sm:text-[8px] bg-sky-600/95 text-white font-bold px-1 py-0.2 rounded-full border border-sky-300 shadow leading-tight">
              🛡️{shield}
            </span>
          )}
          {thorns > 0 && (
            <span className="text-[7px] sm:text-[8px] bg-emerald-800/95 text-white font-bold px-1 py-0.2 rounded-full border border-emerald-400 shadow leading-tight">
              🌵{thorns}
            </span>
          )}
          {poison > 0 && (
            <span className="text-[7px] sm:text-[8px] bg-purple-800/95 text-white font-bold px-1 py-0.2 rounded-full border border-purple-400 shadow leading-tight">
              ☠️{poison}
            </span>
          )}
          {burn > 0 && (
            <span className="text-[7px] sm:text-[8px] bg-orange-700/95 text-white font-bold px-1 py-0.2 rounded-full border border-orange-400 shadow leading-tight">
              🔥{burn}
            </span>
          )}
          {dodge > 0 && (
            <span className="text-[7px] sm:text-[8px] bg-slate-700/95 text-white font-bold px-1 py-0.2 rounded-full border border-slate-400 shadow leading-tight">
              💨{dodge}%
            </span>
          )}
          {taunt && (
            <span className="text-[7px] sm:text-[8px] bg-rose-700/95 text-white font-bold px-1 py-0.2 rounded-full border border-rose-400 shadow leading-tight">
              🎯
            </span>
          )}
          {isSilenced && (
            <span className="text-[7px] sm:text-[8px] bg-stone-700/95 text-white font-bold px-1 py-0.2 rounded-full border border-stone-500 shadow leading-tight">
              🔇
            </span>
          )}
          {card.passives?.doubleStrike && (
            <span className="text-[7px] sm:text-[8px] bg-amber-700/95 text-white px-1 py-0.2 rounded-full shadow leading-tight" title="حمله دوگانه">
              🗡️
            </span>
          )}
          {card.passives?.cleave && (
            <span className="text-[7px] sm:text-[8px] bg-yellow-800/95 text-white px-1 py-0.2 rounded-full shadow leading-tight" title="برش جانبی">
              🪓
            </span>
          )}
          {card.passives?.stealth && (
            <span className="text-[7px] sm:text-[8px] bg-indigo-900/95 text-white px-1 py-0.2 rounded-full shadow leading-tight" title="استتار">
              👻
            </span>
          )}
          {totalAbilities > 0 && (
            <span className="text-[7px] sm:text-[8px] bg-blue-900/95 text-amber-300 font-bold px-1 py-0.2 rounded-full border border-amber-400/60 shadow leading-tight" title="قابلیت‌های اکتیو">
              ⚡{totalAbilities}
            </span>
          )}
        </div>

        {/* ================= 5. FROST OVERLAY (COVERS WHOLE ART) ================= */}
        {isFrozen && (
          <div className="absolute inset-0 bg-cyan-500/35 backdrop-blur-[0.5px] rounded-[10px] flex items-center justify-center text-xl sm:text-2xl z-25 pointer-events-none">
            ❄️
          </div>
        )}

        {/* ================= 6. BOTTOM OVERLAY: CARD NAME & HP BAR ================= */}
        <div className="absolute bottom-1 inset-x-1 sm:inset-x-1.5 z-20 flex flex-col items-center pointer-events-none">
          {/* Card Name Plate */}
          <div className="w-full bg-stone-950/85 backdrop-blur-sm border border-amber-500/50 rounded-md px-1 py-0.2 text-[8px] sm:text-[9.5px] text-center font-black text-amber-200 truncate shadow-md drop-shadow">
            {card.name}
          </div>

          {/* Health Bar Under Name */}
          <div className="w-[85%] mx-auto h-1 sm:h-1.5 bg-black/90 rounded-full overflow-hidden border border-white/20 mt-0.5 shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${hpBarColor}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* ================= 7. CORNER STAT BADGES (ATTACK & HP OVERLAID ON IMAGE) ================= */}
        {/* Bottom-Left: Attack (⚔️) */}
        <div
          className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 z-30 min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1 rounded-full bg-gradient-to-br from-rose-600 via-red-700 to-red-950 border border-amber-400 text-white font-black text-[9px] sm:text-xs flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.9)]"
          title={`قدرت حمله: ${atk}`}
        >
          <span className="leading-none flex items-center gap-0.5">
            <span className="text-[8px] sm:text-[9px]">⚔️</span>
            <span>{atk}</span>
          </span>
        </div>

        {/* Bottom-Right: Health / HP (❤️) */}
        <div
          className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 z-30 min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1 rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-950 border border-amber-400 text-white font-black text-[9px] sm:text-xs flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.9)]"
          title={`سلامتی / جان: ${hp} / ${mxHp}`}
        >
          <span className="leading-none flex items-center gap-0.5">
            <span className="text-[8px] sm:text-[9px]">❤️</span>
            <span>{hp}</span>
          </span>
        </div>
      </div>

      {internalInspectOpen && (
        <CardDetailsModal
          card={card}
          currentHealth={hp}
          currentAttack={atk}
          maxHealth={mxHp}
          cardLevel={cardLevel}
          shield={shield}
          thorns={thorns}
          poison={poison}
          burn={burn}
          dodge={dodge}
          taunt={taunt}
          isFrozen={isFrozen}
          isSilenced={isSilenced}
          onClose={() => setInternalInspectOpen(false)}
        />
      )}
    </>
  );
};

export interface CardDetailsModalProps {
  card: CardDef;
  currentHealth?: number;
  currentAttack?: number;
  maxHealth?: number;
  cardLevel?: number;
  shield?: number;
  thorns?: number;
  poison?: number;
  burn?: number;
  dodge?: number;
  taunt?: boolean;
  isFrozen?: boolean;
  isSilenced?: boolean;
  onClose: () => void;
}

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  card,
  currentHealth,
  currentAttack,
  maxHealth,
  cardLevel,
  shield = 0,
  thorns = 0,
  poison = 0,
  burn = 0,
  dodge = 0,
  taunt = false,
  isFrozen = false,
  isSilenced = false,
  onClose,
}) => {
  const hp = currentHealth !== undefined ? currentHealth : card.health;
  const mxHp = maxHealth !== undefined ? maxHealth : card.health;
  const atk = currentAttack !== undefined ? currentAttack : card.attack;

  const activePassives: { key: string; icon: string; name: string; desc: string; val?: number }[] = [];
  if (card.passives) {
    Object.entries(card.passives).forEach(([k, v]) => {
      const meta = PASSIVE_INFO[k];
      if (meta) {
        if (typeof v === 'number' && v > 0) {
          activePassives.push({ key: k, ...meta, val: v });
        } else if (v === true) {
          activePassives.push({ key: k, ...meta });
        }
      }
    });
  }

  const phaseList: { phaseKey: string; phaseTitle: string; abilities: any[] }[] = [];
  if (card.abilities) {
    Object.entries(card.abilities).forEach(([phaseKey, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        phaseList.push({
          phaseKey,
          phaseTitle: PHASE_NAMES[phaseKey] || phaseKey,
          abilities: list,
        });
      }
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 cursor-pointer animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-stone-900 border-2 border-amber-500 rounded-3xl p-4 sm:p-5 text-stone-100 flex flex-col gap-3.5 shadow-2xl max-h-[90vh] overflow-y-auto cursor-default animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{card.icon || '⚔️'}</span>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-amber-300 text-base">{card.name}</h3>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shadow ${
                    TYPE_COLORS[card.type] || 'bg-stone-700'
                  }`}
                >
                  {TYPE_NAMES[card.type] || card.type}
                </span>
                <span className="text-[9px] bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded-full border border-stone-700 font-bold">
                  {card.tier}
                </span>
              </div>
              {cardLevel !== undefined && cardLevel > 1 && (
                <span className="text-[10px] text-amber-400 font-black">
                  ⭐ سطح کارت: {cardLevel} (+{cardLevel - 1}% قدرت و جان)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Full Character Artwork Showcase in Modal */}
        {card.image && (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-xl group">
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute bottom-2 right-2.5 z-10 text-right">
              <span className="text-[10px] text-amber-300 font-bold bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-amber-500/40 shadow">
                تمثال کامل دلاور شاهنامه
              </span>
              <h4 className="text-base font-black text-amber-100 drop-shadow mt-0.5">
                {card.name}
              </h4>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-950/80 p-2.5 rounded-2xl border border-stone-800 text-xs">
          <div className="text-center bg-stone-900/60 p-1.5 rounded-xl">
            <span className="text-[10px] text-stone-400 block">قدرت حمله</span>
            <b className="text-rose-400 text-sm">⚔️ {atk}</b>
          </div>
          <div className="text-center bg-stone-900/60 p-1.5 rounded-xl">
            <span className="text-[10px] text-stone-400 block">سلامتی / جان</span>
            <b className="text-emerald-400 text-sm">
              ❤️ {hp} / {mxHp}
            </b>
          </div>
          {shield > 0 && (
            <div className="text-center bg-stone-900/60 p-1.5 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[10px] text-sky-400 block">سپر دفاعی</span>
              <b className="text-sky-300 text-sm">🛡️ {shield}</b>
            </div>
          )}
        </div>

        {/* Buffs */}
        {(thorns > 0 || poison > 0 || burn > 0 || dodge > 0 || taunt || isFrozen || isSilenced) && (
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-stone-400 font-bold ml-1">وضعیت‌های نبرد:</span>
            {thorns > 0 && (
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded">
                🌵 خار ({thorns})
              </span>
            )}
            {poison > 0 && (
              <span className="bg-purple-950 text-purple-300 border border-purple-700 px-1.5 py-0.5 rounded">
                ☠️ زهر ({poison})
              </span>
            )}
            {burn > 0 && (
              <span className="bg-orange-950 text-orange-300 border border-orange-700 px-1.5 py-0.5 rounded">
                🔥 آتش ({burn})
              </span>
            )}
            {dodge > 0 && (
              <span className="bg-slate-900 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                💨 جاخالی ({dodge}%)
              </span>
            )}
            {taunt && (
              <span className="bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded">
                🎯 تحریک‌شده
              </span>
            )}
            {isFrozen && (
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded">
                ❄️ یخ‌زده
              </span>
            )}
            {isSilenced && (
              <span className="bg-stone-800 text-stone-300 border border-stone-700 px-1.5 py-0.5 rounded">
                🔇 ساکت‌شده
              </span>
            )}
          </div>
        )}

        {/* Passive Abilities */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-black text-amber-300 flex items-center gap-1">
            <span>🔥</span>
            <span>ویژگی‌های پسیو (Passives):</span>
          </h4>
          {activePassives.length === 0 ? (
            <div className="text-[11px] text-stone-500 bg-stone-950/40 p-2 rounded-xl border border-stone-800/80">
              این کارت قابلیت پسیو فعالی ندارد.
            </div>
          ) : (
            <div className="space-y-1">
              {activePassives.map((p) => (
                <div
                  key={p.key}
                  className="bg-stone-950/90 border border-amber-500/30 p-2 rounded-xl text-xs space-y-0.5"
                >
                  <div className="flex items-center gap-1.5 font-black text-amber-200">
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    {p.val !== undefined && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 rounded-full font-bold">
                        {p.val}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed pr-5">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phase Abilities */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-black text-amber-300 flex items-center gap-1">
            <span>⚡</span>
            <span>قابلیت‌های اکتیو (Abilities):</span>
          </h4>
          {phaseList.length === 0 ? (
            <div className="text-[11px] text-stone-500 bg-stone-950/40 p-2 rounded-xl border border-stone-800/80">
              این کارت قابلیت فازی اضافه‌ای ندارد.
            </div>
          ) : (
            <div className="space-y-2">
              {phaseList.map((group) => (
                <div
                  key={group.phaseKey}
                  className="bg-stone-950/90 border border-stone-800 p-2.5 rounded-2xl space-y-1.5"
                >
                  <div className="font-bold text-[11px] text-amber-400 border-b border-stone-800/80 pb-1">
                    {group.phaseTitle}
                  </div>
                  <div className="space-y-1">
                    {group.abilities.map((ab, i) => (
                      <div
                        key={ab.id || i}
                        className="bg-stone-900/60 p-2 rounded-xl text-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{ab.icon || '⚡'}</span>
                          <div>
                            <span className="font-black text-stone-200">{ab.label}</span>
                            <span className="text-[10px] text-stone-400 block">
                              هدف: <b>{ab.targetSide === 'ally' ? 'یاران خودی' : 'دشمنان'}</b>
                            </span>
                          </div>
                        </div>
                        {ab.amount !== undefined && ab.amount > 0 && (
                          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs px-2 py-0.5 rounded-lg">
                            مقدار: {ab.amount}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {card.description && (
          <div className="bg-stone-950/50 p-2.5 rounded-2xl border border-stone-800/80 text-[11px] text-stone-400 leading-relaxed italic">
            "{card.description}"
          </div>
        )}

        {/* Marketplace USD Trading Note */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex items-center justify-between text-[11px] text-emerald-300">
          <span className="flex items-center gap-1.5 font-bold">
            <span>💵</span>
            <span>معامله در بازارچه اساطیر:</span>
          </span>
          <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200 font-bold">
            قابل فروش با دلار آمریکا ($ USD) یا سکه طلا
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-stone-800 hover:bg-stone-700 py-2.5 rounded-xl font-bold text-xs text-stone-200 transition"
        >
          بستن
        </button>
      </div>
    </div>
  );
};
