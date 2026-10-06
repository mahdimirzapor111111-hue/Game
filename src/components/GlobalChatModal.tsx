import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, GlobalChatMessage, ChatChannel, CardDef } from '../types/game';
import { loadGlobalMessages, sendGlobalChatMessage } from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS } from '../assets/visuals';

interface GlobalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  cardLibrary: CardDef[];
  onChallengePlayer?: (targetUser: UserProfile) => void;
  defaultChannel?: ChatChannel;
}

export const GlobalChatModal: React.FC<GlobalChatModalProps> = ({
  isOpen,
  onClose,
  user,
  cardLibrary,
  onChallengePlayer,
  defaultChannel = 'global',
}) => {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>(defaultChannel);
  const [messages, setMessages] = useState<GlobalChatMessage[]>(() => loadGlobalMessages());
  const [inputText, setInputText] = useState('');
  const [showCardSharePicker, setShowCardSharePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages(loadGlobalMessages());
      setActiveChannel(defaultChannel);
    }
  }, [isOpen, defaultChannel]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isOpen) {
        setMessages(loadGlobalMessages());
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) => m.channel === activeChannel);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    sound.play('select');
    const msg = sendGlobalChatMessage(user, inputText, activeChannel);
    if (msg) {
      setInputText('');
      setMessages(loadGlobalMessages());
    }
  };

  const handleSendDuelChallenge = () => {
    sound.play('card_place');
    const challengeText = `⚔️ من برای نبرد تن‌به‌تن و دوئل اساطیری آماده‌ام! چه کسی شجاعت مبارزه با ارتش من را دارد؟`;
    sendGlobalChatMessage(user, challengeText, activeChannel, {
      type: 'duel_challenge',
      challengeDetails: {
        wagerGold: 100,
      },
    });
    setMessages(loadGlobalMessages());
    setNotice('چالش دوئل شما در تالار ارسال شد!');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleShareCard = (card: CardDef) => {
    sound.play('coin');
    const userProg = user.cardProgress?.[card.id];
    const level = userProg?.level || 1;
    const shareText = `🃏 کارت «${card.name}» سطح ${level} من! حمله: ${card.attack} | جان: ${card.health}`;

    sendGlobalChatMessage(user, shareText, activeChannel, {
      type: 'card_share',
      cardShare: {
        cardId: card.id,
        cardName: card.name,
        cardLevel: level,
        cardType: card.type,
        cardImage: card.image,
      },
    });
    setShowCardSharePicker(false);
    setMessages(loadGlobalMessages());
    setNotice(`کارت ${card.name} با موفقیت به اشتراک گذاشته شد!`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleAcceptChallenge = (msg: GlobalChatMessage) => {
    sound.play('victory');
    if (onChallengePlayer && msg.senderId !== user.id) {
      const oppUser: UserProfile = {
        id: msg.senderId,
        username: msg.senderName,
        displayName: msg.senderName,
        role: msg.senderRole,
        level: msg.senderLevel || 1,
        xp: 100,
        gold: 1000,
        gems: 50,
        usd: 10,
        trophies: msg.senderTrophies || 200,
        wins: 10,
        losses: 5,
        totalDamage: 500,
        unlockedCardIds: cardLibrary.slice(0, 5).map((c) => c.id),
        activeDeck: [
          [cardLibrary[1]?.id || null, null, cardLibrary[2]?.id || null],
          [cardLibrary[3]?.id || null, cardLibrary[0]?.id || null, null],
          [null, cardLibrary[0]?.id || null, null],
        ],
        cardProgress: {},
        campaignCompletedIndex: 1,
        avatar: msg.senderAvatar,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      onClose();
      onChallengePlayer(oppUser);
    }
  };

  const unlockedCards = cardLibrary.filter((c) => user.unlockedCardIds.includes(c.id));

  const EMOJI_LIST = ['⚔️', '🛡️', '👑', '💎', '💵', '🔥', '🏆', '🦁', '🦅', '🐉', '💥', '✨', '🏹', '🐎', '🍷', '⚡'];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-4 sm:p-5 text-stone-100 flex flex-col gap-3.5 shadow-2xl my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] h-[680px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-500 p-0.5 shadow-lg flex items-center justify-center text-stone-950 font-black text-xl">
              💬
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                <span>تالار گفتگوی شاهنامه و دیپلماسی کلن‌ها</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  🟢 آنلاین
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                چت همگانی با تمامی دلاوران ایران‌زمین، رجزخوانی، اشتراک کارت و هماهنگی نبردهای قبیله‌ای
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="flex bg-stone-950 p-1.5 rounded-2xl border border-stone-800 gap-2">
          <button
            onClick={() => {
              sound.play('click');
              setActiveChannel('global');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeChannel === 'global'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md border border-amber-400'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>🌍</span>
            <span>چت جهانی دربار شاهنامه</span>
            <span className="text-[10px] bg-stone-900/60 px-1.5 py-0.2 rounded-full font-mono">
              {messages.filter((m) => m.channel === 'global').length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.play('click');
              setActiveChannel('inter_clan');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeChannel === 'inter_clan'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>🛡️</span>
            <span>چت دیپلماسی و بین کلن‌ها (اتحادیه‌ها)</span>
            <span className="text-[10px] bg-stone-900/60 px-1.5 py-0.2 rounded-full font-mono">
              {messages.filter((m) => m.channel === 'inter_clan').length}
            </span>
          </button>
        </div>

        {notice && (
          <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs p-2 rounded-xl text-center font-bold animate-in fade-in">
            ✓ {notice}
          </div>
        )}

        {/* Messages Viewport */}
        <div className="flex-1 bg-stone-950/80 border border-stone-800 rounded-2xl p-3.5 overflow-y-auto flex flex-col gap-3 shadow-inner">
          {filteredMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-500 text-xs p-6 text-center">
              <span className="text-3xl mb-2">📜</span>
              <span>پیامی در این تالار موجود نیست. اولین پهلوانی باشید که سخن می‌گوید!</span>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === user.id;
              const isAdmin = msg.senderRole === 'admin';
              const isChallenge = msg.type === 'duel_challenge';
              const isCardShare = msg.type === 'card_share';
              const isSystem = msg.type === 'system';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-stone-400">
                    <UserAvatar avatar={msg.senderAvatar} size="xs" />
                    <span className={`font-black ${isAdmin ? 'text-amber-300' : 'text-stone-200'}`}>
                      {msg.senderName}
                    </span>
                    {isAdmin && (
                      <span className="bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full shadow">
                        مدیر کل 👑
                      </span>
                    )}
                    {msg.clanName && (
                      <span className="bg-purple-950 text-purple-300 border border-purple-700/60 font-bold px-1.5 py-0.2 rounded text-[9px]">
                        {msg.clanBadge || '🛡️'} {msg.clanName}
                      </span>
                    )}
                    <span className="bg-stone-900 text-amber-400 font-bold px-1 py-0.2 rounded border border-stone-800">
                      🏆 {msg.senderTrophies}
                    </span>
                    <span className="text-stone-500">
                      {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed shadow-lg ${
                      isSystem
                        ? 'bg-amber-950/70 border border-amber-500/60 text-amber-200 w-full text-center rounded-2xl'
                        : isMe
                        ? 'bg-gradient-to-r from-amber-700/80 to-amber-600/90 text-stone-100 rounded-tl-none border border-amber-500/40'
                        : 'bg-stone-900 border border-stone-800 text-stone-100 rounded-tr-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Duel Challenge Widget */}
                    {isChallenge && (
                      <div className="mt-2.5 pt-2 border-t border-amber-500/30 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                          <span>⚔️</span>
                          <span>چالش دوئل تن‌به‌تن</span>
                        </span>
                        {!isMe && onChallengePlayer && (
                          <button
                            onClick={() => handleAcceptChallenge(msg)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] px-3 py-1 rounded-xl shadow-md transition cursor-pointer active:scale-95 animate-pulse"
                          >
                            قبول چالش و نبرد ⚔️
                          </button>
                        )}
                      </div>
                    )}

                    {/* Card Share Widget */}
                    {isCardShare && msg.cardShare && (
                      <div className="mt-2.5 pt-2 border-t border-stone-700/60 flex items-center gap-3 bg-stone-950/60 p-2 rounded-xl border border-stone-800">
                        {msg.cardShare.cardImage && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400 shrink-0">
                            <img
                              src={msg.cardShare.cardImage}
                              alt={msg.cardShare.cardName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="text-right">
                          <b className="text-amber-300 font-black block">{msg.cardShare.cardName}</b>
                          <span className="text-[10px] text-stone-400">
                            سطح {msg.cardShare.cardLevel} | نوع: {msg.cardShare.cardType}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Bar (Duel Challenge, Share Card, Emoji Presets) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleSendDuelChallenge}
              className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer active:scale-95 border border-rose-400"
            >
              <span>⚔️</span>
              <span>ارسال چالش دوئل</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCardSharePicker(!showCardSharePicker)}
              className="bg-stone-800 hover:bg-stone-700 text-amber-300 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition border border-amber-500/30 flex items-center gap-1 cursor-pointer"
            >
              <span>🃏</span>
              <span>اشتراک کارت</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold px-2 py-1.5 rounded-xl transition border border-stone-700 flex items-center gap-1 cursor-pointer"
            >
              <span>😀</span>
              <span>شکلک</span>
            </button>
          </div>

          <span className="text-[10px] text-stone-400">
            {activeChannel === 'global' ? 'کانال عمومی' : 'کانال دیپلماسی کلن‌ها'}
          </span>
        </div>

        {/* Emoji Bar Picker */}
        {showEmojiPicker && (
          <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex gap-1.5 overflow-x-auto no-scrollbar animate-in fade-in">
            {EMOJI_LIST.map((em, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + em);
                  setShowEmojiPicker(false);
                }}
                className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-sm cursor-pointer hover:scale-110 transition"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Card Share Drawer Picker */}
        {showCardSharePicker && (
          <div className="bg-stone-950 p-2.5 rounded-xl border border-amber-500/40 flex gap-2 overflow-x-auto no-scrollbar animate-in fade-in">
            <span className="text-xs text-stone-400 shrink-0 self-center">انتخاب کارت برای اشتراک:</span>
            {unlockedCards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleShareCard(c)}
                className="bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400 p-1.5 rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer transition"
              >
                <span>{c.icon || '🃏'}</span>
                <span className="text-xs font-bold text-amber-200">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeChannel === 'global'
                ? 'پیام خود را برای تمام پهلوانان دربار شاهنامه بنویسید...'
                : 'پیام دیپلماسی یا رجزخوانی برای اعضا و سلطان‌های سایر کلن‌ها...'
            }
            className="flex-1 bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-stone-100 focus:outline-none shadow-inner"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black px-5 py-2.5 rounded-2xl text-xs sm:text-sm transition cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5 shrink-0 border border-amber-300"
          >
            <span>ارسال</span>
            <span>📤</span>
          </button>
        </form>
      </div>
    </div>
  );
};
