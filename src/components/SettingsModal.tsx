import React, { useState } from 'react';
import { sound } from '../services/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [sfxOn, setSfxOn] = useState(sound.soundOn);
  const [musicOn, setMusicOn] = useState(sound.musicOn);
  const [vol, setVol] = useState(Math.round(sound.musicVolume * 100));

  if (!isOpen) return null;

  const handleToggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    sound.setSoundEnabled(next);
  };

  const handleToggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    sound.setMusicEnabled(next);
  };

  const handleVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value) || 0;
    setVol(v);
    sound.setMusicVolume(v / 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-stone-900 border-2 border-stone-700 rounded-3xl p-6 text-stone-100 flex flex-col gap-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-stone-400 hover:text-white p-1 cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-3xl mb-1">⚙️</div>
          <h3 className="text-lg font-black text-amber-400">تنظیمات بازی</h3>
        </div>

        {/* SFX Toggle */}
        <div className="flex items-center justify-between bg-stone-950/80 p-3 rounded-xl border border-stone-800">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-lg">{sfxOn ? '🔊' : '🔇'}</span>
            <span>افکت‌های صوتی نبرد (SFX)</span>
          </div>
          <button
            onClick={handleToggleSfx}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              sfxOn ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400'
            }`}
          >
            {sfxOn ? 'روشن' : 'خاموش'}
          </button>
        </div>

        {/* Music Toggle */}
        <div className="flex items-center justify-between bg-stone-950/80 p-3 rounded-xl border border-stone-800">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-lg">{musicOn ? '🎵' : '🔇'}</span>
            <span>موسیقی پس‌زمینه شاهنامه</span>
          </div>
          <button
            onClick={handleToggleMusic}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              musicOn ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400'
            }`}
          >
            {musicOn ? 'روشن' : 'خاموش'}
          </button>
        </div>

        {/* Music Volume */}
        <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span>میزان بلندی صدا:</span>
            <span className="text-amber-400">{vol}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={vol}
            onChange={handleVolChange}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

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
