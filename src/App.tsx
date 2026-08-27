import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { ThemeProvider, useTheme } from './lib/themeContext';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { JournalEditor } from './components/JournalEditor';
import { JournalHistory } from './components/JournalHistory';
import { InsightsDashboard } from './components/InsightsDashboard';
import { ThemeStudio } from './components/ThemeStudio';
import { StickerStudio } from './components/StickerStudio';
import { PrivacySecurityCenter } from './components/PrivacySecurityCenter';
import { CodelockModal } from './components/CodelockModal';
import { ReminderModal } from './components/ReminderModal';
import { JournalEntry, SyncStatus, StickerItem, StickerPlacement } from './types';
import { subscribeToJournals, saveJournal, deleteJournal } from './lib/storage';
import { Sparkles, RefreshCw } from 'lucide-react';

const createDefaultEntry = (): JournalEntry => ({
  id: `entry_${Date.now()}`,
  title: '',
  content: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  favorite: false,
  pinned: false,
  archived: false,
  tags: ['daily'],
  emoji: '🌸',
  category: 'daily',
  stickers: [],
});

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const { palette, settings } = useTheme();

  const [activeTab, setActiveTab] = useState<
    'editor' | 'history' | 'insights' | 'themes' | 'stickers' | 'privacy'
  >('editor');

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry>(createDefaultEntry());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Offline / Online sync event listeners
  useEffect(() => {
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time Firestore Subscriptions for authenticated user
  useEffect(() => {
    if (!user) return;

    setSyncStatus('syncing');
    const unsubscribe = subscribeToJournals(user.uid, (fetchedEntries) => {
      setEntries(fetchedEntries);
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');

      // If activeEntry is empty new entry or exists in fetched entries, sync it
      setActiveEntry((prev) => {
        const found = fetchedEntries.find((e) => e.id === prev.id);
        if (found) return found;
        if (fetchedEntries.length > 0 && !prev.title && !prev.content) {
          return fetchedEntries[0];
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Codelock Inactivity Timer
  const resetInactivityTimer = useCallback(() => {
    if (!settings.codelockEnabled || !settings.autoLockMinutes || settings.autoLockMinutes <= 0) {
      return;
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, settings.autoLockMinutes * 60 * 1000);
  }, [settings.codelockEnabled, settings.autoLockMinutes]);

  useEffect(() => {
    if (!settings.codelockEnabled) {
      setIsLocked(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetInactivityTimer();

    events.forEach((evt) => window.addEventListener(evt, handler));
    resetInactivityTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handler));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [settings.codelockEnabled, resetInactivityTimer]);

  // Create new journal entry
  const handleNewEntry = () => {
    const newEntry = createDefaultEntry();
    setActiveEntry(newEntry);
    setActiveTab('editor');
  };

  // Select entry from history to open in editor
  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setActiveTab('editor');
  };

  // Toggle favorite
  const handleToggleFavorite = async (entry: JournalEntry) => {
    if (!user) return;
    const updated = { ...entry, favorite: !entry.favorite };
    await saveJournal(user.uid, updated);
  };

  // Toggle pin
  const handleTogglePin = async (entry: JournalEntry) => {
    if (!user) return;
    const updated = { ...entry, pinned: !entry.pinned };
    await saveJournal(user.uid, updated);
  };

  // Toggle archive
  const handleToggleArchive = async (entry: JournalEntry) => {
    if (!user) return;
    const updated = { ...entry, archived: !entry.archived };
    await saveJournal(user.uid, updated);
  };

  // Delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteJournal(user.uid, entryId);
    if (activeEntry.id === entryId) {
      const remaining = entries.filter((e) => e.id !== entryId);
      if (remaining.length > 0) {
        setActiveEntry(remaining[0]);
      } else {
        setActiveEntry(createDefaultEntry());
      }
    }
  };

  // Place sticker onto active journal entry and navigate to editor
  const handleUseStickerOnJournal = (sticker: StickerItem) => {
    const newSticker: StickerPlacement = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      stickerId: sticker.id,
      name: sticker.name,
      emoji: sticker.emoji,
      x: 15 + Math.random() * 60,
      y: 15 + Math.random() * 60,
      rotation: -12 + Math.random() * 24,
    };
    const updated = {
      ...activeEntry,
      stickers: [...(activeEntry.stickers || []), newSticker],
    };
    setActiveEntry(updated);
    if (user) {
      saveJournal(user.uid, updated);
    }
    setActiveTab('editor');
  };

  // Loading Screen
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: palette.bgSolid }}
      >
        <div
          className="w-14 h-14 rounded-3xl flex items-center justify-center text-white text-2xl mb-4 shadow-lg animate-bounce"
          style={{ backgroundColor: palette.accent }}
        >
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          Gemini Journal
        </h2>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-500" />
          Loading your secure private sanctuary...
        </p>
      </div>
    );
  }

  // Unauthenticated -> Landing Page
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-300"
      style={{
        backgroundColor: palette.bgSolid,
        color: palette.textPrimary,
      }}
    >
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncStatus={syncStatus}
        onNewEntry={handleNewEntry}
        onManualLock={() => setIsLocked(true)}
        onOpenReminderModal={() => setIsReminderOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeTab === 'editor' && (
          <JournalEditor
            activeEntry={activeEntry}
            onEntryChange={setActiveEntry}
            onDeleteEntry={handleDeleteEntry}
            syncStatus={syncStatus}
          />
        )}

        {activeTab === 'history' && (
          <JournalHistory
            entries={entries}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
            onToggleFavorite={handleToggleFavorite}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {activeTab === 'insights' && <InsightsDashboard entries={entries} />}

        {activeTab === 'themes' && <ThemeStudio />}

        {activeTab === 'stickers' && (
          <StickerStudio
            entries={entries}
            onUseStickerOnJournal={handleUseStickerOnJournal}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacySecurityCenter
            entries={entries}
            onLockNow={() => setIsLocked(true)}
            onRefreshData={() => {}}
          />
        )}
      </main>

      {/* Codelock Security Modal Overlay */}
      <CodelockModal isOpen={isLocked} onUnlock={() => setIsLocked(false)} />

      {/* Daily Reflection Reminder Modal */}
      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
