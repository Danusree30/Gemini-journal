import React, { useMemo } from 'react';
import {
  BarChart3,
  Flame,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Smile,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { JournalEntry, InsightsMetrics } from '../types';
import { useTheme } from '../lib/themeContext';

interface InsightsDashboardProps {
  entries: JournalEntry[];
}

function getLocalDateKey(dateInput: number | Date | string): string {
  const d =
    typeof dateInput === 'string'
      ? new Date(dateInput)
      : typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ entries }) => {
  const { palette } = useTheme();

  // Compute all metrics rigorously from real entries
  const metrics: InsightsMetrics = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    oneWeekAgo.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    let totalWords = 0;
    let totalStickers = 0;
    let entriesThisWeek = 0;
    let entriesThisMonth = 0;
    const moodCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const stickerCounts: Record<string, { name: string; emoji: string; count: number }> = {};
    const activityDays: Record<string, number> = {};

    // Sort entries by timestamp ascending for streak calculations
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);

    sorted.forEach((e) => {
      const dayKey = getLocalDateKey(e.createdAt);
      if (dayKey) {
        activityDays[dayKey] = (activityDays[dayKey] || 0) + 1;
      }

      // Word count
      const wc = e.wordCount || (e.content ? e.content.trim().split(/\s+/).filter(Boolean).length : 0);
      totalWords += wc;

      // Stickers count
      if (e.stickers && e.stickers.length > 0) {
        totalStickers += e.stickers.length;
        e.stickers.forEach((stk) => {
          const key = stk.name || stk.emoji;
          if (!stickerCounts[key]) {
            stickerCounts[key] = { name: stk.name || 'Sticker', emoji: stk.emoji || '🌸', count: 0 };
          }
          stickerCounts[key].count++;
        });
      }

      const entryDate = new Date(e.createdAt);
      // Time intervals
      if (entryDate >= oneWeekAgo) entriesThisWeek++;
      if (entryDate >= startOfMonth) entriesThisMonth++;

      // Mood counts
      if (e.emoji) {
        moodCounts[e.emoji] = (moodCounts[e.emoji] || 0) + 1;
      }

      // Categories
      if (e.category) {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      }

      // Tags
      e.tags?.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    // Calculate Writing Streaks using local calendar day keys
    const uniqueDays = Object.keys(activityDays).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (uniqueDays.length > 0) {
      // Check streaks
      let prevDate: Date | null = null;
      for (const dayStr of uniqueDays) {
        const [y, m, d] = dayStr.split('-').map(Number);
        const curDate = new Date(y, m - 1, d);
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        prevDate = curDate;
      }

      // Current Streak Check: is today or yesterday in local activityDays?
      const todayStr = getLocalDateKey(now);
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yestStr = getLocalDateKey(yesterday);

      if (activityDays[todayStr] || activityDays[yestStr]) {
        currentStreak = tempStreak;
      } else {
        currentStreak = 0;
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topStickers = Object.values(stickerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return {
      totalEntries: entries.length,
      entriesThisWeek,
      entriesThisMonth,
      currentStreak,
      longestStreak,
      totalWords,
      avgWordsPerEntry: entries.length > 0 ? Math.round(totalWords / entries.length) : 0,
      totalStickers,
      topStickers,
      moodCounts,
      topTags,
      categoryCounts,
      activityDays,
    };
  }, [entries]);

  // Last 14 days chart data (computed in local calendar days)
  const last14Days = useMemo(() => {
    const days: Array<{
      dateStr: string;
      label: string;
      fullDayName: string;
      formattedDate: string;
      isToday: boolean;
      count: number;
    }> = [];

    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dateStr = getLocalDateKey(d);
      const isToday = i === 0;
      const label = d.toLocaleDateString('en-US', { weekday: 'short' }); // "Thu", "Wed", "Tue"
      const fullDayName = d.toLocaleDateString('en-US', { weekday: 'long' }); // "Thursday"
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Aug 27"
      const count = metrics.activityDays[dateStr] || 0;

      days.push({
        dateStr,
        label,
        fullDayName,
        formattedDate,
        isToday,
        count,
      });
    }
    return days;
  }, [metrics.activityDays]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col min-h-0 overflow-y-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-pink-500" />
          <span>Journal Insights & Analytics</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculated exclusively from your private journal entries
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalEntries}</div>
            <div className="text-xs text-slate-500 font-medium">Total Entries Written</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-1.5">
              <span>{metrics.currentStreak}</span>
              <span className="text-xs font-semibold text-purple-600">days</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Current Streak ({metrics.longestStreak} best)</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalWords.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-medium">Total Words Captured</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.entriesThisMonth}</div>
            <div className="text-xs text-slate-500 font-medium">Entries This Month ({metrics.entriesThisWeek} this wk)</div>
          </div>
        </div>
      </div>

      {/* 14-Day Activity Rhythm Bar Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span>14-Day Writing Rhythm</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Daily consistency & entries logged over the last two weeks</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: palette.accent }} />
              <span>Entries Logged</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span>Rest Day</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none pb-2">
          <div className="min-w-[540px] grid grid-cols-14 gap-2 items-end h-44 pt-6 pb-2 border-b border-slate-100">
            {last14Days.map((day) => {
              const heightPct = day.count > 0 ? Math.min(100, Math.max(22, day.count * 30)) : 6;
              return (
                <div
                  key={day.dateStr}
                  title={`${day.fullDayName}, ${day.formattedDate}: ${day.count} ${day.count === 1 ? 'entry' : 'entries'}`}
                  className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                >
                  {/* Count indicator */}
                  <div
                    className={`text-[11px] font-bold transition-all ${
                      day.count > 0
                        ? 'text-pink-600 opacity-100 scale-100'
                        : 'text-slate-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                    }`}
                  >
                    {day.count}
                  </div>

                  {/* Activity Bar */}
                  <div className="w-full max-w-[28px] flex flex-col justify-end items-center h-28">
                    <div
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: day.count > 0 ? palette.accent : '#f1f5f9',
                      }}
                      className={`w-full rounded-t-xl transition-all duration-300 group-hover:brightness-90 ${
                        day.isToday ? 'ring-2 ring-pink-400 ring-offset-1' : ''
                      } ${day.count > 0 ? 'shadow-xs' : ''}`}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="flex flex-col items-center mt-1">
                    <span
                      className={`text-[11px] font-semibold tracking-tight ${
                        day.isToday ? 'text-pink-600 font-extrabold' : 'text-slate-500'
                      }`}
                    >
                      {day.label}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {day.isToday ? (
                        <span className="px-1 py-0.2 rounded bg-pink-100 text-pink-700 font-bold">Today</span>
                      ) : (
                        day.formattedDate.split(' ')[1]
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mood Distribution & Top Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Smile className="w-4 h-4 text-pink-500" />
            <span>Emotional & Mood Distribution</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Mood emojis chosen across your journal entries</p>

          {Object.keys(metrics.moodCounts).length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-8">
              No mood tags recorded yet
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {Object.entries(metrics.moodCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([emoji, count]) => {
                  const pct = Math.round((count / metrics.totalEntries) * 100);
                  return (
                    <div key={emoji} className="flex items-center gap-3">
                      <span className="text-xl w-6">{emoji}</span>
                      <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: palette.accent }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-12 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top Tags Cloud */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-500" />
            <span>Top Tags & Reflection Topics</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Themes you focus on most frequently</p>

          {metrics.topTags.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-8">
              No tags added yet. Add #tags to your entries to see your reflection topics here.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 flex-1 items-start">
              {metrics.topTags.map(({ tag, count }) => (
                <div
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold shadow-2xs"
                >
                  <span>#{tag}</span>
                  <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 text-[10px] flex items-center justify-center">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stickers Adorned Analytics Section */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-xs flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Smile className="w-4 h-4 text-purple-500" />
            <span>Mindful Stickers & Scrapbook Adornments</span>
          </h2>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            {metrics.totalStickers || 0} Total Placements
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Stickers you have placed across your journal memories
        </p>

        {!metrics.topStickers || metrics.topStickers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-purple-50/30 rounded-2xl border border-dashed border-purple-100">
            No stickers placed yet. Adorn your journal entries with cute aesthetic stickers from the Sticker Studio!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {metrics.topStickers.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col items-center justify-center text-center group hover:scale-105 transition-transform"
              >
                <span className="text-3xl mb-1 drop-shadow-xs">{item.emoji}</span>
                <span className="text-xs font-bold text-slate-800 truncate w-full">{item.name}</span>
                <span className="text-[10px] text-purple-600 font-semibold mt-0.5">
                  Used {item.count} time{item.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
