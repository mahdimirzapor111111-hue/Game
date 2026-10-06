import React from 'react';
import { UserProfile, CardDef } from '../types/game';
import { claimUserGift } from '../services/storage';
import { sound } from '../services/audio';

interface GiftInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  cardLibrary: CardDef[];
  onUserUpdate: (u: UserProfile) => void;
}

export const GiftInboxModal: React.FC<GiftInboxModalProps> = ({
  isOpen,
  onClose,
  user,
  cardLibrary,
  onUserUpdate,
}) => {
  if (!isOpen || !user) return null;

  const gifts = user.gifts || [];
  const unclaimedCount = gifts.filter((g) => !g.claimed).length;

  const handleClaim = (giftId: string) => {
    sound.play('coin');
    const result = claimUserGift(user.id, giftId);
    if (result.success && result.user) {
      sound.play('victory');
      onUserUpdate(result.user);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-stone-900 border-2 border-purple-500 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-bounce">🎁</span>
            <div>
              <h3 className="text-base font-black text-purple-300">
                صندوق جوایز و هدایای اساطیری
              </h3>
              <p className="text-[11px] text-stone-400">
                {unclaimedCount > 0
                  ? `شما ${unclaimedCount} هدیه دریافت‌نشده دارید!`
                  : 'تمام هدایا و پاداش‌ها دریافت شده‌اند.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {gifts.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs bg-stone-950/60 rounded-2xl border border-stone-800">
            هنوز هدیه یا پاداشی در صندوق شما ثبت نشده است. با پیروزی در مسابقات و شرکت در رویدادها پاداش کسب کنید!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {gifts.map((gift) => {
              const cardObjs = (gift.cardIds || [])
                .map((cid) => cardLibrary.find((c) => c.id === cid))
                .filter(Boolean) as CardDef[];

              return (
                <div
                  key={gift.id}
                  className={`p-4 rounded-2xl border transition shadow flex flex-col gap-2.5 ${
                    gift.claimed
                      ? 'bg-stone-950/60 border-stone-800 opacity-60'
                      : 'bg-gradient-to-br from-purple-950/50 via-stone-900 to-indigo-950/40 border-purple-500/70 ring-1 ring-purple-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300">
                      فرستنده: {gift.senderName}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {new Date(gift.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-200 leading-relaxed bg-stone-950/70 p-2 rounded-xl border border-stone-800">
                    "{gift.message}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                    {!!gift.gold && (
                      <span className="bg-amber-950/80 text-amber-300 border border-amber-600/70 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span>💰</span>
                        <span>+{gift.gold} طلا</span>
                      </span>
                    )}
                    {!!gift.gems && (
                      <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-600/70 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span>💎</span>
                        <span>+{gift.gems} الماس</span>
                      </span>
                    )}
                    {!!gift.trophies && (
                      <span className="bg-amber-950/80 text-amber-400 border border-amber-600/70 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span>🏆</span>
                        <span>+{gift.trophies} کاپ</span>
                      </span>
                    )}
                    {cardObjs.map((c) => (
                      <span
                        key={c.id}
                        className="bg-purple-950 text-purple-200 border border-purple-500/60 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px]"
                      >
                        <span>{c.icon || '⚔️'}</span>
                        <span>کارت: {c.name}</span>
                      </span>
                    ))}
                  </div>

                  {gift.claimed ? (
                    <span className="text-center text-[10px] text-emerald-400 font-bold bg-emerald-950/40 py-1 rounded-lg border border-emerald-800">
                      ✓ دریافت شده
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaim(gift.id)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs py-2 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                    >
                      <span>🎁</span>
                      <span>دریافت پاداش</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-stone-800 hover:bg-stone-700 py-2.5 rounded-xl font-bold text-xs text-stone-200 transition cursor-pointer"
        >
          بستن
        </button>
      </div>
    </div>
  );
};
