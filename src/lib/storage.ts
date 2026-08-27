import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry, JournalMessage, JournalSummary, UserSettings, BackupData, SyncStatus, StickerItem } from '../types';

/**
 * Strict Undefined-Stripping Utility to ensure Zero-Crash Payload Hygiene.
 * Strips all undefined fields before sending to Firestore SDK.
 */
export function cleanPayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanPayload(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanPayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Default User Settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  codelockEnabled: false,
  codelockPinHash: '',
  codelockSalt: '',
  autoLockMinutes: 5,
  activeThemeId: 'sakura',
  customThemes: [],
  seasonalThemeEnabled: true,
  dailyReminderEnabled: false,
  dailyReminderTime: '20:00',
  aiCreativity: 0.7,
  fontFamily: 'sans',
  fontSize: 'base',
  backgroundPattern: 'none',
};

// 1. Journal CRUD Operations
export async function saveJournal(uid: string, entry: JournalEntry): Promise<void> {
  if (!uid || !entry.id) throw new Error('User ID and Entry ID are required to save journal.');
  const docRef = doc(db, `users/${uid}/journals/${entry.id}`);
  const payload = cleanPayload({
    ...entry,
    updatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteJournal(uid: string, entryId: string): Promise<void> {
  if (!uid || !entryId) throw new Error('User ID and Entry ID required.');
  const docRef = doc(db, `users/${uid}/journals/${entryId}`);
  await deleteDoc(docRef);
}

export function subscribeToJournals(
  uid: string,
  onData: (entries: JournalEntry[], hasPendingWrites: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  if (!uid) return () => {};
  const colRef = collection(db, `users/${uid}/journals`);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      onData(entries, snapshot.metadata.hasPendingWrites);
    },
    (err) => {
      console.error('[Firestore Error subscribeToJournals]:', err);
      if (onError) onError(err);
    }
  );
}

// 2. Journal Messages (AI Chat History)
export async function saveJournalMessage(uid: string, journalId: string, message: JournalMessage): Promise<void> {
  if (!uid || !journalId || !message.id) throw new Error('Invalid message parameters.');
  const docRef = doc(db, `users/${uid}/journals/${journalId}/messages/${message.id}`);
  await setDoc(docRef, cleanPayload(message));
}

export function subscribeToJournalMessages(
  uid: string,
  journalId: string,
  onData: (messages: JournalMessage[]) => void
): () => void {
  if (!uid || !journalId) return () => {};
  const colRef = collection(db, `users/${uid}/journals/${journalId}/messages`);
  const q = query(colRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: JournalMessage[] = [];
    snapshot.forEach((docSnap) => {
      messages.push(docSnap.data() as JournalMessage);
    });
    onData(messages);
  });
}

// 3. Journal Summaries
export async function saveJournalSummary(uid: string, summary: JournalSummary): Promise<void> {
  if (!uid || !summary.id) throw new Error('Invalid summary parameters.');
  const docRef = doc(db, `users/${uid}/summaries/${summary.id}`);
  await setDoc(docRef, cleanPayload(summary));
}

export function subscribeToSummaries(
  uid: string,
  onData: (summaries: JournalSummary[]) => void
): () => void {
  if (!uid) return () => {};
  const colRef = collection(db, `users/${uid}/summaries`);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const summaries: JournalSummary[] = [];
    snapshot.forEach((docSnap) => {
      summaries.push(docSnap.data() as JournalSummary);
    });
    onData(summaries);
  });
}

// 4. User Settings
export async function getUserSettings(uid: string): Promise<UserSettings> {
  if (!uid) return DEFAULT_USER_SETTINGS;
  const docRef = doc(db, `users/${uid}/settings/default`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { ...DEFAULT_USER_SETTINGS, ...(snap.data() as UserSettings) };
  }
  return DEFAULT_USER_SETTINGS;
}

export async function saveUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  if (!uid) throw new Error('User ID required to save settings.');
  const docRef = doc(db, `users/${uid}/settings/default`);
  await setDoc(docRef, cleanPayload(settings), { merge: true });
}

export function subscribeToUserSettings(
  uid: string,
  onData: (settings: UserSettings) => void
): () => void {
  if (!uid) return () => {};
  const docRef = doc(db, `users/${uid}/settings/default`);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onData({ ...DEFAULT_USER_SETTINGS, ...(snap.data() as UserSettings) });
    } else {
      onData(DEFAULT_USER_SETTINGS);
    }
  });
}

// 5. Backups
export async function createCloudBackup(uid: string, backupData: BackupData): Promise<string> {
  if (!uid) throw new Error('User ID required for cloud backup.');
  const backupId = `backup_${Date.now()}`;
  const docRef = doc(db, `users/${uid}/backups/${backupId}`);
  await setDoc(docRef, cleanPayload({ ...backupData, id: backupId }));
  return backupId;
}

export async function getCloudBackups(uid: string): Promise<Array<BackupData & { id: string }>> {
  if (!uid) return [];
  const colRef = collection(db, `users/${uid}/backups`);
  const snap = await getDocs(colRef);
  const backups: Array<BackupData & { id: string }> = [];
  snap.forEach((d) => {
    backups.push(d.data() as any);
  });
  return backups;
}

export async function deleteCloudBackup(uid: string, backupId: string): Promise<void> {
  if (!uid || !backupId) return;
  const docRef = doc(db, `users/${uid}/backups/${backupId}`);
  await deleteDoc(docRef);
}

// 6. Custom Stickers Persistence
export async function saveCustomSticker(uid: string, sticker: StickerItem): Promise<void> {
  if (!uid || !sticker.id) throw new Error('User ID and Sticker ID are required.');
  const docRef = doc(db, `users/${uid}/stickers/${sticker.id}`);
  const payload = cleanPayload({
    ...sticker,
    isCustom: true,
    userId: uid,
    createdAt: sticker.createdAt || Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteCustomSticker(uid: string, stickerId: string): Promise<void> {
  if (!uid || !stickerId) throw new Error('User ID and Sticker ID are required.');
  const docRef = doc(db, `users/${uid}/stickers/${stickerId}`);
  await deleteDoc(docRef);
}

export function subscribeToCustomStickers(
  uid: string,
  onData: (stickers: StickerItem[], hasPendingWrites: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  if (!uid) return () => {};
  const colRef = collection(db, `users/${uid}/stickers`);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const stickers: StickerItem[] = [];
      snapshot.forEach((docSnap) => {
        stickers.push(docSnap.data() as StickerItem);
      });
      onData(stickers, snapshot.metadata.hasPendingWrites);
    },
    (err) => {
      console.error('[Firestore Error subscribeToCustomStickers]:', err);
      if (onError) onError(err);
    }
  );
}

// 7. Favorite Stickers Persistence in User Settings
export async function toggleFavoriteSticker(uid: string, stickerId: string, currentFavorites: string[]): Promise<string[]> {
  if (!uid || !stickerId) return currentFavorites;
  const isFav = currentFavorites.includes(stickerId);
  const updatedFavorites = isFav
    ? currentFavorites.filter((id) => id !== stickerId)
    : [...currentFavorites, stickerId];

  const docRef = doc(db, `users/${uid}/settings/default`);
  await setDoc(docRef, { favoriteStickerIds: updatedFavorites }, { merge: true });
  return updatedFavorites;
}

// 8. Custom Collections Persistence in User Settings
export async function saveStickerCollections(
  uid: string,
  collections: Record<string, string[]>
): Promise<void> {
  if (!uid) return;
  const docRef = doc(db, `users/${uid}/settings/default`);
  await setDoc(docRef, { customCollections: collections }, { merge: true });
}

// 9. Complete Account Data Erasure (Privacy Compliance)
export async function wipeAllUserData(uid: string): Promise<void> {
  if (!uid) return;
  const batch = writeBatch(db);

  // Delete journals
  const journalsRef = collection(db, `users/${uid}/journals`);
  const journalsSnap = await getDocs(journalsRef);
  journalsSnap.forEach((d) => batch.delete(d.ref));

  // Delete summaries
  const summariesRef = collection(db, `users/${uid}/summaries`);
  const summariesSnap = await getDocs(summariesRef);
  summariesSnap.forEach((d) => batch.delete(d.ref));

  // Delete backups
  const backupsRef = collection(db, `users/${uid}/backups`);
  const backupsSnap = await getDocs(backupsRef);
  backupsSnap.forEach((d) => batch.delete(d.ref));

  // Delete custom stickers
  const stickersRef = collection(db, `users/${uid}/stickers`);
  const stickersSnap = await getDocs(stickersRef);
  stickersSnap.forEach((d) => batch.delete(d.ref));

  // Delete settings
  const settingsRef = doc(db, `users/${uid}/settings/default`);
  batch.delete(settingsRef);

  await batch.commit();
}
