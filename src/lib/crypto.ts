/**
 * Web Crypto API Security Utilities for Gemini Journal
 * Implements salted SHA-256 PIN hashing for client-side Journal Codelock.
 * Raw PINs are never stored anywhere in plain text.
 */

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt + 'PersonalGeminiJournal_Salt_2026');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, salt: string, storedHash: string): Promise<boolean> {
  if (!pin || !salt || !storedHash) return false;
  const computedHash = await hashPin(pin, salt);
  return computedHash === storedHash;
}

// Session Lock State Management (stored purely in memory / sessionStorage for active session)
const LOCK_KEY = 'pgj_session_unlocked';
const LAST_ACTIVITY_KEY = 'pgj_last_activity';

export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(LOCK_KEY) === 'true';
}

export function setSessionUnlocked(unlocked: boolean): void {
  if (unlocked) {
    sessionStorage.setItem(LOCK_KEY, 'true');
    updateLastActivity();
  } else {
    sessionStorage.removeItem(LOCK_KEY);
  }
}

export function updateLastActivity(): void {
  sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export function getLastActivity(): number {
  const val = sessionStorage.getItem(LAST_ACTIVITY_KEY);
  return val ? parseInt(val, 10) : 0;
}
