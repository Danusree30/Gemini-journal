export interface StickerPlacement {
  id: string;
  stickerId: string;
  name: string;
  emoji: string;
  x?: number; // relative X percentage (0-100)
  y?: number; // relative Y percentage (0-100)
  rotation?: number; // degrees
  scale?: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: number; // timestamp in ms
  updatedAt: number; // timestamp in ms
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  tags: string[];
  emoji: string;
  category: string;
  stickers?: StickerPlacement[];
  theme?: string;
  summary?: string;
  wordCount?: number;
}

export interface JournalMessage {
  id: string;
  journalId: string;
  role: 'user' | 'gemini';
  content: string;
  createdAt: number;
}

export interface JournalSummary {
  id: string;
  journalId: string;
  title: string;
  shortSummary: string;
  keyTakeaways: string[];
  actionItems: string[];
  reflectionQuestion: string;
  rawMarkdown: string;
  createdAt: number;
}

export interface CustomTheme {
  id: string;
  name: string;
  bg: string;
  cardBg: string;
  textColor: string;
  textMuted: string;
  accentColor: string;
  borderColor: string;
  aiBubbleBg: string;
  userBubbleBg: string;
  buttonBg: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  category: 'preset' | 'seasonal' | 'custom';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  bgGradient: string;
  bgSolid: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentLight: string;
  aiBubble: string;
  userBubble: string;
  buttonPrimary: string;
  badgeBg: string;
}

export interface UserSettings {
  codelockEnabled: boolean;
  codelockPinHash?: string;
  codelockSalt?: string;
  autoLockMinutes: number; // 0 for instant on blur, 1, 5, 15, 30
  historyPinLockEnabled?: boolean; // PIN lock protection for History page
  autoLockHistoryOnLeave?: boolean; // automatically re-lock History when navigating away
  activeThemeId: string;
  customThemes: CustomTheme[];
  seasonalThemeEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "20:00"
  aiCreativity: number; // 0.1 to 1.0
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: 'sm' | 'base' | 'lg';
  backgroundPattern: 'none' | 'dots' | 'grid' | 'lines' | 'subtle-stars';
  favoriteStickerIds?: string[];
  customCollections?: Record<string, string[]>;
}

export interface StickerItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
  description?: string;
  isCustom?: boolean;
  createdAt?: number;
  userId?: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  category: string;
  emoji: string;
  description: string;
  defaultTags: string[];
  initialContent: string;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  app: string;
  userUid: string;
  journals: JournalEntry[];
  settings?: Partial<UserSettings>;
  summaries?: JournalSummary[];
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface InsightsMetrics {
  totalEntries: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  avgWordsPerEntry: number;
  totalStickers?: number;
  topStickers?: Array<{ name: string; emoji: string; count: number }>;
  moodCounts: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  categoryCounts: Record<string, number>;
  activityDays: Record<string, number>; // YYYY-MM-DD -> count
}

