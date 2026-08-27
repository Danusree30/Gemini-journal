import React, { useState } from 'react';
import { Bell, X, Sparkles, Check, Clock } from 'lucide-react';
import { useTheme } from '../lib/themeContext';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, palette } = useTheme();
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleTestNotification = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('🌸 Gemini Journal', {
          body: 'Time for your evening reflection. How did your heart feel today?',
          icon: '/favicon.ico',
        });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } else {
        alert('Notification permission was not granted by browser.');
      }
    } else {
      alert('Browser notifications are not supported on this device.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: palette.accent }}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Daily Mindful Reminder</h3>
              <p className="text-[11px] text-slate-400">Keep your reflection streak alive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-pink-50/50 rounded-2xl border border-pink-200">
          <div>
            <div className="text-xs font-bold text-pink-900">Enable Daily Reflection</div>
            <div className="text-[11px] text-pink-700/80">Receive a gentle mindful reminder</div>
          </div>
          <input
            type="checkbox"
            checked={settings.dailyReminderEnabled}
            onChange={(e) => updateSettings({ dailyReminderEnabled: e.target.checked })}
            className="w-5 h-5 rounded text-pink-500 focus:ring-pink-400 cursor-pointer"
          />
        </div>

        {/* Time Selector */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Reminder Time
          </span>
          <input
            type="time"
            value={settings.dailyReminderTime || '20:00'}
            onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
          />
        </div>

        {/* Test Notification Button */}
        <button
          onClick={handleTestNotification}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{testSent ? 'Notification Triggered!' : 'Send Test Notification'}</span>
        </button>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl text-white text-xs font-bold shadow-xs transition-transform hover:scale-101 cursor-pointer"
          style={{ backgroundColor: palette.buttonPrimary }}
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};
