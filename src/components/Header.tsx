import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  History,
  BarChart3,
  Palette,
  Smile,
  Shield,
  Lock,
  Cloud,
  CloudOff,
  RefreshCw,
  Bell,
  LogOut,
  Plus,
  Moon,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useTheme } from '../lib/themeContext';
import { SyncStatus } from '../types';

interface HeaderProps {
  activeTab: 'editor' | 'history' | 'insights' | 'themes' | 'stickers' | 'privacy';
  setActiveTab: (tab: 'editor' | 'history' | 'insights' | 'themes' | 'stickers' | 'privacy') => void;
  syncStatus: SyncStatus;
  onNewEntry: () => void;
  onManualLock: () => void;
  onOpenReminderModal: () => void;
  isHistoryLocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncStatus,
  onNewEntry,
  onManualLock,
  onOpenReminderModal,
  isHistoryLocked = false,
}) => {
  const { user, signOut } = useAuth();
  const { palette, settings } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Synced</span>
          </div>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span className="hidden sm:inline">Syncing...</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <CloudOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Offline</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <CloudOff className="w-3.5 h-3.5 text-rose-500" />
            <span>Sync failed</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 border-b border-pink-100/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & New Entry */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            onClick={() => setActiveTab('editor')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: palette.accent }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="hidden md:block">
              <div className="font-bold text-sm tracking-tight" style={{ color: palette.textPrimary }}>
                Gemini Journal
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none">
                AI Reflection • Zero-Trust
              </div>
            </div>
          </div>

          <button
            onClick={onNewEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-xs transition-transform hover:scale-105 cursor-pointer"
            style={{ backgroundColor: palette.buttonPrimary }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-semibold">New Entry</span>
          </button>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-white shadow-xs text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-pink-500" />
            <span>Write</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white shadow-xs text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-500" />
            <span>History & Search</span>
            {isHistoryLocked && (
              <span
                title="History Archive Vault is PIN Locked"
                className="p-0.5 rounded bg-purple-100 text-purple-700 inline-flex items-center"
              >
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-white shadow-xs text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Insights</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-white shadow-xs text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>Color Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'stickers'
                ? 'bg-white shadow-xs text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-rose-500" />
            <span>Stickers</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white shadow-xs text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Privacy & Backup</span>
          </button>
        </nav>

        {/* Right: Sync Status + Lock + Reminders + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {getSyncBadge()}

          {/* Daily Reminder Trigger */}
          <button
            onClick={onOpenReminderModal}
            title="Daily Reflection Reminder"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              settings.dailyReminderEnabled
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Codelock Manual Lock */}
          {settings.codelockEnabled && (
            <button
              onClick={onManualLock}
              title="Lock Journal Now"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: palette.accent }}
                >
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user?.displayName || 'Journal Writer'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span>Security & Privacy Center</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('themes')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    <span>Theme & Color Studio</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar (Bottom on Small Screens) */}
      <div className="lg:hidden flex items-center justify-around py-2 px-3 border-t border-slate-100 bg-white/95 text-[11px] font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex flex-col items-center gap-0.5 ${
            activeTab === 'editor' ? 'text-pink-600 font-bold' : ''
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Write</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-0.5 relative ${
            activeTab === 'history' ? 'text-purple-600 font-bold' : ''
          }`}
        >
          <div className="relative">
            <History className="w-4 h-4" />
            {isHistoryLocked && (
              <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                <Lock className="w-2 h-2" />
              </span>
            )}
          </div>
          <span>History</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center gap-0.5 ${
            activeTab === 'insights' ? 'text-emerald-600 font-bold' : ''
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Insights</span>
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`flex flex-col items-center gap-0.5 ${
            activeTab === 'themes' ? 'text-amber-600 font-bold' : ''
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Themes</span>
        </button>

        <button
          onClick={() => setActiveTab('stickers')}
          className={`flex flex-col items-center gap-0.5 ${
            activeTab === 'stickers' ? 'text-rose-600 font-bold' : ''
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>Stickers</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex flex-col items-center gap-0.5 ${
            activeTab === 'privacy' ? 'text-blue-600 font-bold' : ''
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy</span>
        </button>
      </div>
    </header>
  );
};
