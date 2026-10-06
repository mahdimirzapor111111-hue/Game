import React, { useState } from 'react';
import { GAME_VISUALS } from '../assets/visuals';

interface UserAvatarProps {
  avatar?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  borderRing?: boolean;
  crownRank?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  className = '',
  size = 'md',
  borderRing = true,
  crownRank,
}) => {
  const [imgError, setImgError] = useState(false);

  // Resolve avatar URL
  const resolveAvatarSrc = (raw?: string | null): string | null => {
    if (!raw) return null;
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    // Match against visual keys or filenames
    if (raw.includes('rostam')) return GAME_VISUALS.rostamHero;
    if (raw.includes('tahmineh')) return GAME_VISUALS.tahminehAvatar;
    if (raw.includes('zahak')) return GAME_VISUALS.zahakVillain;
    if (raw.includes('arash')) return GAME_VISUALS.arashArcher;
    if (raw.includes('sohrab')) return GAME_VISUALS.sohrabHero;
    if (raw.includes('simurgh')) return GAME_VISUALS.simurghBird;
    if (raw.includes('div_sepid') || raw.includes('demon')) return GAME_VISUALS.demonKing;
    if (raw.includes('kaveh')) return GAME_VISUALS.kavehBlacksmith;

    if (raw.startsWith('src/')) return `/${raw}`;
    if (raw.startsWith('/')) return raw;
    if (
      raw.includes('.jpg') ||
      raw.includes('.png') ||
      raw.includes('.jpeg') ||
      raw.includes('.svg') ||
      raw.includes('.webp')
    ) {
      return `/${raw}`;
    }
    return null;
  };

  const src = resolveAvatarSrc(avatar);
  const isImage = Boolean(src) && !imgError;

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
    '2xl': 'w-28 h-28 text-6xl',
  };

  const crownImage =
    crownRank === 1
      ? GAME_VISUALS.crownGoldImperial
      : crownRank === 2
      ? GAME_VISUALS.crownSilverRegal
      : crownRank === 3
      ? GAME_VISUALS.crownBronzeWarrior
      : crownRank && crownRank <= 10
      ? GAME_VISUALS.crownTopChampion
      : null;

  const crownSizes = {
    xs: 'w-4 h-4 -top-2',
    sm: 'w-5 h-5 -top-2.5',
    md: 'w-6 h-6 -top-3',
    lg: 'w-8 h-8 -top-4',
    xl: 'w-10 h-10 -top-5',
    '2xl': 'w-14 h-14 -top-7',
  };

  const avatarElement = (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center select-none bg-stone-900 shrink-0 ${
        borderRing ? 'border-2 border-amber-500/80 shadow-md shadow-amber-950/40' : ''
      } ${sizeClasses[size]} ${className}`}
    >
      {isImage && src ? (
        <img
          src={src}
          alt="Avatar"
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="leading-none drop-shadow">
          {avatar && !avatar.includes('/') && !avatar.includes('.') ? avatar : '🤴'}
        </span>
      )}
    </div>
  );

  if (crownImage) {
    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
        <div
          className={`absolute z-10 pointer-events-none drop-shadow-lg flex items-center justify-center ${crownSizes[size]}`}
        >
          <img
            src={crownImage}
            alt={`Rank ${crownRank} Crown`}
            className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          />
        </div>
        {avatarElement}
      </div>
    );
  }

  return avatarElement;
};
