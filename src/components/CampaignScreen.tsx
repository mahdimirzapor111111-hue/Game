import React, { useState } from 'react';
import { StageDef, CardDef, UserProfile, CampaignPageConfig } from '../types/game';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface CampaignScreenProps {
  stages: StageDef[];
  user: UserProfile | null;
  cardLibrary: CardDef[];
  config: CampaignPageConfig;
  onSelectStage: (stage: StageDef) => void;
  onGoToDeck: () => void;
}

export const CampaignScreen: React.FC<CampaignScreenProps> = ({
  stages,
  user,
  cardLibrary,
  config,
  onSelectStage,
  onGoToDeck,
}) => {
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const completedIdx = user?.campaignCompletedIndex || 0;

  const handleStartStage = (stage: StageDef, stageIndex: number) => {
    if (stageIndex > completedIdx) {
      sound.play('hit');
      setErrorNotice('ابتدا باید مراحل پیشین هفت‌خوان را فتح کنید.');
      return;
    }

    let hasKing = false;
    user?.activeDeck?.forEach((row) => {
      row.forEach((cid) => {
        if (cid) {
          const c = cardLibrary.find((x) => x.id === cid);
          if (c?.type === 'king') hasKing = true;
        }
      });
    });

    if (!hasKing) {
      sound.play('hit');
      setErrorNotice('برای شروع نبرد، چیدمان ارتش شما حتماً باید دارای کارت پادشاه باشد.');
      return;
    }

    sound.play('click');
    setErrorNotice(null);
    onSelectStage(stage);
  };

  return (
    <div
      className="w-full flex-1 flex flex-col items-center p-3 sm:p-5 overflow-y-auto select-none text-stone-100 pb-24"
      style={{
        backgroundColor: config.bgColor || '#120b08',
        backgroundImage: config.bgImage ? `url(${config.bgImage})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* ================= CAMPAIGN QUEST HERO BANNER ================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src={GAME_VISUALS.campaignQuestBanner}
            alt="Campaign Quest"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/85 via-stone-950/75 to-purple-950/85 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4 text-center md:text-right">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl shrink-0 bg-stone-900 ring-4 ring-amber-500/30">
              <img src={GAME_VISUALS.mapCampaignIcon} alt="Map" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-2xl font-black flex items-center justify-center md:justify-start gap-2 drop-shadow"
                style={{ color: config.titleColor || '#ffd54f' }}
              >
                <span>{config.titleText || 'هفت‌خوان اساطیر شاهنامه'}</span>
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed drop-shadow">
                {config.subtitleText || 'مراحل را با پیروزی سپری کنید تا جوایز بزرگ، صندوق‌های طلایی و کارت‌های اساطیری کسب کنید'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <button
              onClick={onGoToDeck}
              className="bg-stone-900/90 hover:bg-stone-800 border border-amber-500/50 text-amber-300 font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer backdrop-blur"
            >
              <img src={GAME_VISUALS.deckSwordsIcon} alt="Deck" className="w-4 h-4 rounded-full object-cover" />
              <span>تنظیم ارتش</span>
            </button>
          </div>
        </div>

        {errorNotice && (
          <div className="bg-rose-950/90 border border-rose-600 text-rose-200 text-xs p-3.5 rounded-2xl text-center flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl animate-in zoom-in-95 font-bold">
            <span>⚠️ {errorNotice}</span>
            <button
              onClick={onGoToDeck}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-4 py-1.5 rounded-xl text-xs whitespace-nowrap shadow cursor-pointer flex items-center gap-1"
            >
              <img src={GAME_VISUALS.deckSwordsIcon} alt="Deck" className="w-4 h-4 rounded-full" />
              <span>رفتن به چیدمان ارتش</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((st, idx) => {
            const isUnlocked = idx <= completedIdx;
            const isCompleted = idx < completedIdx;

            const diffColor =
              st.difficulty === 'boss'
                ? 'bg-rose-950 border-rose-600 text-rose-300'
                : st.difficulty === 'hard'
                ? 'bg-orange-950 border-orange-600 text-orange-300'
                : st.difficulty === 'medium'
                ? 'bg-amber-950 border-amber-600 text-amber-300'
                : 'bg-emerald-950 border-emerald-600 text-emerald-300';

            const diffName =
              st.difficulty === 'boss'
                ? 'غول مرحله (Boss)'
                : st.difficulty === 'hard'
                ? 'سخت'
                : st.difficulty === 'medium'
                ? 'متوسط'
                : 'ساده';

            return (
              <div
                key={st.id}
                style={{
                  backgroundColor: config.cardBgColor || '#1c130f',
                  borderColor: isUnlocked ? (config.cardBorderColor || '#4e342e') : '#33231c',
                }}
                className={`border rounded-3xl p-5 flex flex-col justify-between gap-3.5 shadow-xl transition-all ${
                  isUnlocked ? 'hover:scale-[1.02] hover:border-amber-500/80 ring-1 ring-amber-500/20' : 'opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-black text-base text-amber-300">{st.title}</span>
                    <div className="flex items-center gap-1">
                      {isCompleted && (
                        <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-black border border-emerald-500/40">
                          ✓ فتح شده
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${diffColor}`}>
                        {diffName}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{st.description}</p>
                </div>

                {/* Mini Preview of Enemy Formation */}
                <div className="bg-stone-950/80 border border-stone-800/80 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 shadow-inner">
                  <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                    <img src={GAME_VISUALS.duelSwordsIcon} alt="Formation" className="w-3.5 h-3.5 rounded-full" />
                    <span>آرایش لشکر دشمن:</span>
                  </span>
                  <div className="flex flex-col gap-1">
                    {[0, 1, 2].map((r) => (
                      <div key={`prev-row-${r}`} className="flex gap-1">
                        {[0, 1, 2].map((c) => {
                          const unit = st.enemyFormation?.[r]?.[c];
                          return (
                            <div
                              key={`prev-cell-${r}-${c}`}
                              className="w-7 h-9 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center text-xs relative shadow"
                            >
                              {unit ? (
                                <>
                                  <span>{unit.icon || '⚔️'}</span>
                                  {unit.type === 'king' && (
                                    <span className="absolute -top-1 -right-1 text-[8px]">👑</span>
                                  )}
                                </>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs font-black">
                    <span className="text-amber-400 flex items-center gap-1">
                      <img src={GAME_VISUALS.coinIcon} alt="Gold" className="w-4 h-4 rounded-full" />
                      <span>{st.rewardGold}</span>
                    </span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      <img src={GAME_VISUALS.gemIcon} alt="XP" className="w-4 h-4 rounded-full" />
                      <span>{st.rewardXp} XP</span>
                    </span>
                  </div>
                  {isUnlocked ? (
                    <button
                      onClick={() => handleStartStage(st, idx)}
                      style={{
                        backgroundColor: config.startBtnBg || '#ffb300',
                      }}
                      className="hover:brightness-110 text-stone-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer flex items-center gap-1.5 border border-amber-300"
                    >
                      <img src={GAME_VISUALS.duelSwordsIcon} alt="Fight" className="w-4 h-4 rounded-full" />
                      <span>{config.startBtnText || 'آغاز نبرد'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-stone-500 font-bold bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                      🔒 قفل
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
