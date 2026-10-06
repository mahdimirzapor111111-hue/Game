import React, { useState, useEffect } from 'react';
import { UserProfile, CardDef, AllPagesConfig, StageDef, BattleMode, BotDifficulty } from './types/game';
import {
  getActiveUser,
  loadAllUsers,
  setActiveUserId,
  loadCards,
  loadPagesConfig,
  loadStages,
  checkAndDistributeEndedEvents,
} from './services/storage';
import { sound } from './services/audio';
import { Navbar, ScreenTab } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { BattleScreen } from './components/BattleScreen';
import { CampaignScreen } from './components/CampaignScreen';
import { DeckBuilder } from './components/DeckBuilder';
import { ClanScreen } from './components/ClanScreen';
import { EventsScreen } from './components/EventsScreen';
import { ShopScreen } from './components/ShopScreen';
import { MarketplaceScreen } from './components/MarketplaceScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { CardEditorScreen } from './components/CardEditorScreen';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { GiftInboxModal } from './components/GiftInboxModal';
import { SettingsModal } from './components/SettingsModal';
import { UsdFinanceModal } from './components/UsdFinanceModal';
import { GlobalChatModal } from './components/GlobalChatModal';
import { GameTutorialModal } from './components/GameTutorialModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const active = getActiveUser();
    if (active) return active;
    const all = loadAllUsers();
    if (all.length > 0) {
      // Default visitors to a regular player account so admin is never exposed by default
      const defaultPlayer = all.find((u) => u.role === 'player') || all[0];
      setActiveUserId(defaultPlayer.id);
      return defaultPlayer;
    }
    return null;
  });

  const [cardLibrary, setCardLibrary] = useState<CardDef[]>(() => loadCards());
  const [pagesConfig, setPagesConfig] = useState<AllPagesConfig>(() => loadPagesConfig());
  const [stages, setStages] = useState<StageDef[]>(() => loadStages());
  const [currentTab, setCurrentTab] = useState<ScreenTab>('home');

  // Battle session parameters
  const [activeBattleStage, setActiveBattleStage] = useState<StageDef | null>(null);
  const [activeBattleMode, setActiveBattleMode] = useState<BattleMode>('pvp_ranked');
  const [activeOpponent, setActiveOpponent] = useState<UserProfile | null>(null);
  const [activeBotDiff, setActiveBotDiff] = useState<BotDifficulty>('normal');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [usdFinanceModalOpen, setUsdFinanceModalOpen] = useState(false);
  const [globalChatOpen, setGlobalChatOpen] = useState(false);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [giftInboxOpen, setGiftInboxOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    const startAudioContext = () => {
      if (sound.musicOn) {
        sound.startMusic();
      }
      window.removeEventListener('pointerdown', startAudioContext);
    };
    window.addEventListener('pointerdown', startAudioContext, { once: true });
    return () => window.removeEventListener('pointerdown', startAudioContext);
  }, []);

  useEffect(() => {
    if (currentTab === 'admin' && user?.role !== 'admin') {
      setCurrentTab('home');
    }
  }, [currentTab, user]);

  useEffect(() => {
    const syncEventsAndGifts = () => {
      const { totalGiftsSent, settledEvents } = checkAndDistributeEndedEvents();
      if (totalGiftsSent > 0 || settledEvents.length > 0) {
        const fresh = getActiveUser();
        if (fresh) {
          setUser(fresh);
        }
      }
    };
    syncEventsAndGifts();
    const interval = setInterval(syncEventsAndGifts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: ScreenTab) => {
    if (tab === 'admin' && user?.role !== 'admin') {
      alert('دسترسی به این بخش ویژه مدیر کل است.');
      setAuthModalOpen(true);
      return;
    }
    if (tab === 'battle') {
      setActiveBattleStage(null);
      setActiveBattleMode('bot');
      setActiveOpponent(null);
    }
    setCurrentTab(tab);
  };

  const handleStartBattleFromHome = (params: {
    mode: BattleMode;
    opponent?: UserProfile | null;
    difficulty?: BotDifficulty;
  }) => {
    setActiveBattleMode(params.mode);
    setActiveOpponent(params.opponent || null);
    setActiveBotDiff(params.difficulty || 'normal');
    setActiveBattleStage(null);
    setCurrentTab('battle');
  };

  const handleStartCampaignStage = (stage: StageDef) => {
    setActiveBattleStage(stage);
    setActiveBattleMode('campaign');
    setActiveOpponent(null);
    setCurrentTab('battle');
  };

  const handleChallengePlayer = (targetUser: UserProfile) => {
    setActiveBattleMode('pvp_friendly');
    setActiveOpponent(targetUser);
    setActiveBattleStage(null);
    setCurrentTab('battle');
  };

  const handleLogout = () => {
    setActiveUserId(null);
    setUser(null);
    setAuthModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* Navigation & Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenGifts={() => setGiftInboxOpen(true)}
        onOpenUsdFinance={() => setUsdFinanceModalOpen(true)}
        onOpenGlobalChat={() => setGlobalChatOpen(true)}
        onOpenTutorial={() => setTutorialModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* If current user is banned */}
      {user?.isBanned ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-stone-950/95">
          <div className="max-w-md w-full bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95">
            <span className="text-5xl animate-bounce">🚫</span>
            <h2 className="text-xl font-black text-rose-400">حساب کاربری شما مسدود شده است</h2>
            <div className="bg-rose-950/70 border border-rose-700/80 rounded-2xl p-3.5 text-xs text-rose-200 text-right w-full space-y-1">
              <span className="font-bold text-amber-300 block">علت مسدودسازی:</span>
              <p className="leading-relaxed">
                {user.banReason || 'نقض قوانین مبارزه و بازی جوانمردانه در دربار شاهنامه.'}
              </p>
            </div>
            <p className="text-xs text-stone-400">
              برای پیگیری یا ورود با حساب دیگر، از دکمه زیر استفاده نمایید.
            </p>
            <button
              onClick={handleLogout}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-xs px-6 py-2.5 rounded-xl border border-stone-700 transition cursor-pointer"
            >
              خروج و تغییر حساب کاربری
            </button>
          </div>
        </div>
      ) : (
        /* Main Content Viewport */
        <main className={`flex-1 flex flex-col min-h-0 relative overflow-hidden ${currentTab === 'battle' ? 'pb-0' : 'pb-14 sm:pb-16'}`}>
          {currentTab === 'home' && user && (
            <HomeScreen
              user={user}
              cardLibrary={cardLibrary}
              onStartBattle={handleStartBattleFromHome}
              onOpenCampaign={() => setCurrentTab('campaign')}
              onOpenDeck={() => setCurrentTab('deck')}
              onOpenLeaderboard={() => setCurrentTab('leaderboard')}
              onOpenClan={() => setCurrentTab('clan')}
              onOpenProfile={() => setProfileModalOpen(true)}
              onOpenEvents={() => setCurrentTab('events')}
              onOpenGifts={() => setGiftInboxOpen(true)}
              onOpenGlobalChat={() => setGlobalChatOpen(true)}
              onOpenTutorial={() => setTutorialModalOpen(true)}
              onUserUpdate={(u) => setUser(u)}
            />
          )}

          {currentTab === 'events' && user && (
            <EventsScreen
              user={user}
              cardLibrary={cardLibrary}
              onGoToBattle={() => handleStartBattleFromHome({ mode: 'pvp_ranked' })}
              onGoToDeck={() => setCurrentTab('deck')}
              onOpenGifts={() => setGiftInboxOpen(true)}
              onUserUpdate={(u) => setUser(u)}
            />
          )}

          {currentTab === 'clan' && user && (
            <ClanScreen
              user={user}
              onUserUpdate={(u) => setUser(u)}
              onChallengePlayer={handleChallengePlayer}
              onOpenDeck={() => setCurrentTab('deck')}
            />
          )}

          {currentTab === 'battle' && (
            <BattleScreen
              user={user}
              cardLibrary={cardLibrary}
              stage={activeBattleStage}
              battleMode={activeBattleMode}
              opponentProfile={activeOpponent}
              botDifficulty={activeBotDiff}
              config={pagesConfig.battlePage}
              onBattleEnd={() => setCurrentTab('home')}
              onRefreshUser={(u) => setUser(u)}
              onGoToDeck={() => setCurrentTab('deck')}
            />
          )}

          {currentTab === 'campaign' && (
            <CampaignScreen
              stages={stages}
              user={user}
              cardLibrary={cardLibrary}
              config={pagesConfig.campaignPage}
              onSelectStage={handleStartCampaignStage}
              onGoToDeck={() => setCurrentTab('deck')}
            />
          )}

          {currentTab === 'deck' && user && (
            <DeckBuilder
              user={user}
              cardLibrary={cardLibrary}
              onUserUpdate={(u) => setUser(u)}
              onGoToMarket={() => setCurrentTab('market')}
            />
          )}

          {currentTab === 'editor' && (
            <CardEditorScreen
              cardLibrary={cardLibrary}
              user={user}
              onUpdateCards={(c) => setCardLibrary(c)}
              onTestBattle={(customCard) => {
                if (user) {
                  const nextUnlocked = Array.from(new Set([...user.unlockedCardIds, customCard.id]));
                  const nextDeck = user.activeDeck.map((r) => [...r]);
                  let placed = false;
                  for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                      if (!nextDeck[r][c]) {
                        nextDeck[r][c] = customCard.id;
                        placed = true;
                        break;
                      }
                    }
                    if (placed) break;
                  }
                  if (!placed) nextDeck[1][0] = customCard.id;
                  const updatedU = { ...user, unlockedCardIds: nextUnlocked, activeDeck: nextDeck };
                  setUser(updatedU);
                }
                setActiveBattleMode('bot');
                setActiveOpponent(null);
                setActiveBattleStage(null);
                setCurrentTab('battle');
              }}
            />
          )}

          {currentTab === 'market' && user && (
            <MarketplaceScreen
              user={user}
              cardLibrary={cardLibrary}
              onUserUpdate={(u) => setUser(u)}
            />
          )}

          {currentTab === 'shop' && user && (
            <ShopScreen
              user={user}
              cardLibrary={cardLibrary}
              config={pagesConfig.shopPage}
              onUserUpdate={(u) => setUser(u)}
            />
          )}

          {currentTab === 'leaderboard' && (
            <LeaderboardScreen
              user={user}
              onChallengePlayer={handleChallengePlayer}
            />
          )}

          {currentTab === 'admin' && user?.role === 'admin' && (
            <AdminPanel
              user={user}
              cardLibrary={cardLibrary}
              pagesConfig={pagesConfig}
              stages={stages}
              onUpdateCards={(c) => setCardLibrary(c)}
              onUpdatePagesConfig={(p) => setPagesConfig(p)}
              onUpdateStages={(s) => setStages(s)}
            />
          )}
        </main>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onUserUpdate={(u) => setUser(u)}
        onOpenEditor={() => setCurrentTab('editor')}
        onOpenClan={() => setCurrentTab('clan')}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenUsdFinance={() => setUsdFinanceModalOpen(true)}
      />

      {/* USD Currency Finance & Direct Admin Chat Modal */}
      {user && (
        <UsdFinanceModal
          isOpen={usdFinanceModalOpen}
          onClose={() => setUsdFinanceModalOpen(false)}
          user={user}
          onUserUpdate={(u) => setUser(u)}
        />
      )}

      {/* Gift Inbox Modal */}
      <GiftInboxModal
        isOpen={giftInboxOpen}
        onClose={() => setGiftInboxOpen(false)}
        user={user}
        cardLibrary={cardLibrary}
        onUserUpdate={(u) => setUser(u)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          setAuthModalOpen(false);
        }}
        currentUser={user}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      {/* Global & Inter-Clan Chat Modal */}
      {user && (
        <GlobalChatModal
          isOpen={globalChatOpen}
          onClose={() => setGlobalChatOpen(false)}
          user={user}
          cardLibrary={cardLibrary}
          onChallengePlayer={handleChallengePlayer}
        />
      )}

      {/* Illustrated Game Guide & Tutorial Modal for New Players */}
      {user && (
        <GameTutorialModal
          isOpen={tutorialModalOpen}
          onClose={() => setTutorialModalOpen(false)}
          user={user}
          cardLibrary={cardLibrary}
          onUserUpdate={(u) => setUser(u)}
          onStartPracticeBattle={() => handleStartBattleFromHome({ mode: 'bot', difficulty: 'easy' })}
          onGoToDeck={() => setCurrentTab('deck')}
        />
      )}
    </div>
  );
}
