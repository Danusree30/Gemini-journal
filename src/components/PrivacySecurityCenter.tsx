import React, { useState } from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Bell,
  Trash2,
  Check,
  AlertTriangle,
  FileText,
  Database,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useTheme } from '../lib/themeContext';
import { JournalEntry } from '../types';
import { hashPin, generateSalt } from '../lib/crypto';
import { saveJournal, wipeAllUserData } from '../lib/storage';

interface PrivacySecurityCenterProps {
  entries: JournalEntry[];
  onLockNow: () => void;
  onRefreshData: () => void;
}

export const PrivacySecurityCenter: React.FC<PrivacySecurityCenterProps> = ({
  entries,
  onLockNow,
  onRefreshData,
}) => {
  const { user, signOut } = useAuth();
  const { settings, updateSettings, palette } = useTheme();

  // Codelock state
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [isDisablingPin, setIsDisablingPin] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);

  // Backup restore state
  const [isExporting, setIsExporting] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Purge state
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  // Handle Set or Change PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (pinInput.length < 4 || pinInput.length > 6 || !/^\d+$/.test(pinInput)) {
      setPinError('PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (pinInput !== confirmPinInput) {
      setPinError('PIN confirmation does not match.');
      return;
    }

    try {
      const salt = generateSalt();
      const hash = await hashPin(pinInput, salt);
      await updateSettings({
        codelockEnabled: true,
        codelockPinHash: hash,
        codelockSalt: salt,
        historyPinLockEnabled: true,
        autoLockHistoryOnLeave: true,
      });
      setPinSuccess('PIN protection saved successfully!');
      setPinInput('');
      setConfirmPinInput('');
      setShowChangePin(false);
      setTimeout(() => setPinSuccess(null), 3500);
    } catch (err: any) {
      setPinError('Failed to securely hash PIN. Please try again.');
    }
  };

  const handleDisablePin = async () => {
    setIsDisablingPin(true);
    setPinError(null);
    try {
      await updateSettings({
        codelockEnabled: false,
        codelockPinHash: '',
        codelockSalt: '',
      });
      setShowDisableConfirm(false);
      setPinInput('');
      setConfirmPinInput('');
      setPinSuccess('Codelock PIN protection has been disabled.');
      setTimeout(() => setPinSuccess(null), 3500);
    } catch (err: any) {
      setPinError('Failed to disable PIN protection. Please try again.');
    } finally {
      setIsDisablingPin(false);
    }
  };

  // Export all journals as JSON backup
  const handleExportBackup = () => {
    setIsExporting(true);
    try {
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userEmail: user?.email,
        totalEntries: entries.length,
        entries,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `personal_gemini_journal_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setIsExporting(false);
    }
  };

  // Restore journals from JSON file
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreSuccess(false);

    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (!json.entries || !Array.isArray(json.entries)) {
          throw new Error('Invalid backup format: missing entries array.');
        }

        // Restore each entry into user collection
        for (const entry of json.entries) {
          if (entry.id && entry.title !== undefined) {
            await saveJournal(user.uid, entry);
          }
        }

        setRestoreSuccess(true);
        onRefreshData();
        setTimeout(() => setRestoreSuccess(false), 4000);
      } catch (err: any) {
        setRestoreError(err.message || 'Failed to parse or restore backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Purge all data
  const handlePurgeAll = async () => {
    if (!user) return;
    setIsPurging(true);
    setPurgeError(null);
    try {
      await wipeAllUserData(user.uid);
      setShowPurgeConfirm(false);
      onRefreshData();
    } catch (err: any) {
      setPurgeError('Error during data purge: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col min-h-0 overflow-y-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span>Security, Privacy & Codelock Center</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Zero-trust data isolation, client-side encryption, and private backups
        </p>
      </div>

      {/* Grid of Security Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Codelock PIN Vault */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Codelock PIN Lock</h2>
                  <p className="text-xs text-slate-400">Protects your screen from curious eyes</p>
                </div>
              </div>

              {settings.codelockEnabled && (
                <button
                  onClick={onLockNow}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Now</span>
                </button>
              )}
            </div>

            {settings.codelockEnabled ? (
              <div className="space-y-3 mb-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900">Codelock is Active</div>
                      <div className="text-[11px] text-emerald-700">PBKDF2 SHA-256 salted hash protection</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowChangePin(!showChangePin);
                        setShowDisableConfirm(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {showChangePin ? 'Cancel' : 'Change PIN'}
                    </button>
                    {!showDisableConfirm && (
                      <button
                        onClick={() => {
                          setShowDisableConfirm(true);
                          setShowChangePin(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Disable PIN
                      </button>
                    )}
                  </div>
                </div>

                {showChangePin && (
                  <form onSubmit={handleSavePin} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 animate-in fade-in space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900">Update Security PIN</span>
                      <span className="text-[10px] text-purple-600">4-6 digits</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="password"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="New PIN"
                        className="p-2 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none text-center tracking-widest font-mono text-slate-800"
                      />
                      <input
                        type="password"
                        maxLength={6}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Confirm New PIN"
                        className="p-2 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none text-center tracking-widest font-mono text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-transform hover:scale-101 cursor-pointer"
                    >
                      Save New PIN
                    </button>
                  </form>
                )}

                {showDisableConfirm && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-300 animate-in fade-in space-y-2">
                    <p className="text-xs font-bold text-rose-900">
                      Are you sure you want to disable PIN protection?
                    </p>
                    <p className="text-[11px] text-rose-700">
                      Anyone with access to your browser will be able to view your journal entries without entering a PIN.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleDisablePin}
                        disabled={isDisablingPin}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isDisablingPin ? 'Disabling...' : 'Yes, Disable PIN'}
                      </button>
                      <button
                        onClick={() => setShowDisableConfirm(false)}
                        disabled={isDisablingPin}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {pinError && <p className="text-xs text-rose-600 font-medium">{pinError}</p>}
                {pinSuccess && <p className="text-xs text-emerald-600 font-medium">{pinSuccess}</p>}
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-3 mb-4">
                <p className="text-xs text-slate-600">
                  Set a 4-6 digit numeric PIN to lock your journal and history:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter 4-6 Digit PIN"
                    className="p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-center tracking-widest font-mono"
                  />
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Confirm PIN"
                    className="p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-center tracking-widest font-mono"
                  />
                </div>

                {pinError && <p className="text-xs text-rose-600 font-medium">{pinError}</p>}
                {pinSuccess && <p className="text-xs text-emerald-600 font-medium">{pinSuccess}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-xs transition-transform hover:scale-101 cursor-pointer"
                  style={{ backgroundColor: palette.buttonPrimary }}
                >
                  Enable PIN Protection
                </button>
              </form>
            )}

            {/* History Page Lock Settings */}
            <div className="space-y-2 pt-3 border-t border-slate-100 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-500" />
                  Lock History Page with PIN
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.historyPinLockEnabled !== false}
                    onChange={(e) => updateSettings({ historyPinLockEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  Auto-Relock History on Leave
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoLockHistoryOnLeave !== false}
                    onChange={(e) => updateSettings({ autoLockHistoryOnLeave: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* Auto-Lock Inactivity Timer Setting */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Auto-Lock on Inactivity
              </span>
              <select
                value={settings.autoLockMinutes}
                onChange={(e) => updateSettings({ autoLockMinutes: Number(e.target.value) })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 cursor-pointer"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={0}>Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Backups & Data Export */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Backups & Data Portability</h2>
                <p className="text-xs text-slate-400">Export or restore your full journal archive anytime</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Your journal entries belong entirely to you. You can export a snapshot backup in structured JSON
              format, or restore from an existing backup file.
            </p>

            <div className="space-y-3">
              {/* Export Button */}
              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full py-2.5 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export All ({entries.length}) Entries as JSON Backup</span>
              </button>

              {/* Restore Input */}
              <label className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Restore Journals from JSON Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>

              {restoreSuccess && (
                <p className="text-xs text-emerald-600 font-medium">Backup restored successfully!</p>
              )}
              {restoreError && <p className="text-xs text-rose-600 font-medium">{restoreError}</p>}
            </div>
          </div>
        </div>

        {/* Card 3: Daily Mindful Reflection Reminders */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Daily Reflection Notification</h2>
                <p className="text-xs text-slate-400">Gentle prompts to keep your daily writing streak</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dailyReminderEnabled}
                onChange={(e) => updateSettings({ dailyReminderEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Preferred Reminder Time</span>
            <input
              type="time"
              value={settings.dailyReminderTime || '20:00'}
              onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Card 4: Threat Model & Security Matrix */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Security Engineering Standards</span>
          </h2>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Zero Insecure Defaults:</span>
                <p className="text-[11px] text-slate-500">
                  Firestore rules enforce owner-bound path verification (<code className="bg-emerald-100 px-1 rounded">request.auth.uid == userId</code>).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Server-Side Secret Hygiene:</span>
                <p className="text-[11px] text-slate-500">
                  Gemini API key is isolated in backend Express proxy. Zero API keys exposed in browser.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Defensive Payload Sanitization:</span>
                <p className="text-[11px] text-slate-500">
                  Zero-crash undefined stripping on all Firestore mutations and input sanitization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Purge All Data */}
      <div className="p-6 rounded-3xl bg-rose-50/40 border border-rose-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Danger Zone: Permanent Data Deletion</span>
            </h3>
            <p className="text-xs text-rose-700/80 mt-0.5">
              Permanently delete all your cloud journal entries, summaries, and chat messages.
            </p>
          </div>

          <button
            onClick={() => setShowPurgeConfirm(true)}
            className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Purge All My Data
          </button>
        </div>

        {showPurgeConfirm && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-rose-300 shadow-lg animate-in fade-in">
            <p className="text-xs font-bold text-rose-900 mb-2">
              ⚠️ Are you absolutely sure? This action cannot be undone.
            </p>
            {purgeError && <p className="text-xs text-rose-600 font-medium mt-2">{purgeError}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePurgeAll}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {isPurging ? 'Purging...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setShowPurgeConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
