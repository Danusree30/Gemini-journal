import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Type,
  Grid,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Save,
  Sliders,
} from 'lucide-react';
import { PRESET_PALETTES, SEASONAL_PALETTES, getCurrentSeason, getSeasonInfo } from '../data/palettes';
import { useTheme } from '../lib/themeContext';
import { ThemePalette, CustomTheme } from '../types';

export const ThemeStudio: React.FC = () => {
  const { palette, selectTheme, saveCustomTheme, settings, updateSettings } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState<'presets' | 'custom' | 'typography'>('presets');
  const currentSeason = getCurrentSeason();
  const currentSeasonInfo = getSeasonInfo(currentSeason);

  // Custom colors state
  const [customColors, setCustomColors] = useState<ThemePalette>({
    ...palette,
    id: `custom_${Date.now()}`,
    name: 'My Custom Palette',
  });

  const handleApplyCustom = async () => {
    const customTheme: CustomTheme = {
      id: customColors.id || `custom_${Date.now()}`,
      name: customColors.name || 'My Custom Palette',
      bg: customColors.bgSolid,
      cardBg: customColors.cardBg,
      textColor: customColors.textPrimary,
      textMuted: customColors.textSecondary,
      accentColor: customColors.accent,
      borderColor: customColors.cardBorder,
      aiBubbleBg: customColors.aiBubble,
      userBubbleBg: customColors.userBubble,
      buttonBg: customColors.buttonPrimary,
    };
    await saveCustomTheme(customTheme);
  };

  const seasonalList = Object.values(SEASONAL_PALETTES);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col min-h-0 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Palette className="w-6 h-6 text-pink-500" />
            <span>Theme & Color Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize your journal aesthetics with seasonal palettes, typography, and paper patterns
          </p>
        </div>

        {/* Studio Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('presets')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'presets'
                ? 'bg-pink-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Color Palettes
          </button>
          <button
            onClick={() => setActiveSubTab('custom')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'custom'
                ? 'bg-pink-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Custom Palette Creator
          </button>
          <button
            onClick={() => setActiveSubTab('typography')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'typography'
                ? 'bg-pink-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Typography & Paper
          </button>
        </div>
      </div>

      {/* Tab 1: Presets & Seasonal */}
      {activeSubTab === 'presets' && (
        <div className="space-y-6">
          {/* Seasonal Palettes Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Seasonal Dynamic Palettes</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Live Season: {currentSeasonInfo.emoji} {currentSeasonInfo.name}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aesthetic palettes that automatically adapt to the calendar season ({currentSeasonInfo.months})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.seasonalThemeEnabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectTheme('seasonal-auto');
                      } else {
                        updateSettings({ seasonalThemeEnabled: false, activeThemeId: palette.id });
                      }
                    }}
                    className="rounded text-pink-500 focus:ring-pink-400 cursor-pointer"
                  />
                  <span>Auto-apply current season</span>
                </label>
              </div>
            </div>

            {/* Dynamic Seasonal Auto Notice */}
            {settings.seasonalThemeEnabled && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentSeasonInfo.emoji}</span>
                  <div>
                    <span className="font-bold">Auto-Seasonal Theme is Active: </span>
                    <span>Currently using <strong>{currentSeasonInfo.name}</strong> for {currentSeasonInfo.months}.</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Dynamic
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {seasonalList.map((p) => {
                const isCurrent = palette.id === p.id || (settings.seasonalThemeEnabled && p.season === currentSeason);
                const isSeasonNow = p.season === currentSeason;
                return (
                  <div
                    key={p.id}
                    onClick={() => selectTheme(p.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'border-pink-500 bg-pink-50/60 shadow-sm ring-2 ring-pink-300'
                        : 'border-slate-200 hover:border-pink-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">{p.name}</span>
                      {isCurrent ? (
                        <Check className="w-4 h-4 text-pink-600" />
                      ) : isSeasonNow ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">
                          Now
                        </span>
                      ) : null}
                    </div>

                    <div className="text-[10px] text-slate-400 mb-3 font-medium">
                      {p.season === 'spring' && '🌸 March – May'}
                      {p.season === 'summer' && '☀️ June – August'}
                      {p.season === 'autumn' && '🍂 September – November'}
                      {p.season === 'winter' && '❄️ December – February'}
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" title="Background" style={{ backgroundColor: p.bgSolid }} />
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" title="Accent" style={{ backgroundColor: p.accent }} />
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" title="Primary Button" style={{ backgroundColor: p.buttonPrimary }} />
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" title="AI Bubble" style={{ backgroundColor: p.aiBubble }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Master Presets */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Curated Color Palettes</h2>
            <p className="text-xs text-slate-400 mb-6">Designed with soothing contrast and gentle pastels</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_PALETTES.map((p) => {
                const isCurrent = palette.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => selectTheme(p.id)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'border-pink-500 bg-pink-50/50 shadow-md ring-2 ring-pink-300'
                        : 'border-slate-200 hover:border-pink-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-bold text-slate-800">{p.name}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-pink-600" />}
                    </div>

                    {/* Preview Box */}
                    <div
                      className="p-3 rounded-2xl border border-black/5 shadow-inner mb-3 flex items-center justify-between"
                      style={{ backgroundColor: p.bgSolid }}
                    >
                      <div className="w-6 h-6 rounded-xl text-white flex items-center justify-center text-[10px]" style={{ backgroundColor: p.accent }}>
                        🌸
                      </div>
                      <div className="px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-2xs" style={{ backgroundColor: p.buttonPrimary }}>
                        Button
                      </div>
                      <div className="px-2 py-1 rounded-lg text-[10px] border shadow-2xs" style={{ backgroundColor: p.aiBubble, color: p.textPrimary }}>
                        AI Note
                      </div>
                    </div>

                    {/* Swatches */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: p.bgSolid }} />
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: p.accent }} />
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: p.buttonPrimary }} />
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: p.userBubble }} />
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: p.aiBubble }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Palette Creator */}
      {activeSubTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Color Controls */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-500" />
              <span>Custom Color Sliders</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Palette Name</span>
                <input
                  type="text"
                  value={customColors.name}
                  onChange={(e) => setCustomColors({ ...customColors, name: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">App Background Canvas</span>
                <input
                  type="color"
                  value={customColors.bgSolid}
                  onChange={(e) => setCustomColors({ ...customColors, bgSolid: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Accent Color</span>
                <input
                  type="color"
                  value={customColors.accent}
                  onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Primary Buttons</span>
                <input
                  type="color"
                  value={customColors.buttonPrimary}
                  onChange={(e) => setCustomColors({ ...customColors, buttonPrimary: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">AI Note Bubble Color</span>
                <input
                  type="color"
                  value={customColors.aiBubble}
                  onChange={(e) => setCustomColors({ ...customColors, aiBubble: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">User Chat Bubble Color</span>
                <input
                  type="color"
                  value={customColors.userBubble}
                  onChange={(e) => setCustomColors({ ...customColors, userBubble: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Text Primary Color</span>
                <input
                  type="color"
                  value={customColors.textPrimary}
                  onChange={(e) => setCustomColors({ ...customColors, textPrimary: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none"
                />
              </div>
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: customColors.buttonPrimary }}
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Custom Palette</span>
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Live Preview of Custom Palette</h2>

            <div
              className="flex-1 p-6 rounded-3xl border border-black/10 shadow-inner flex flex-col justify-between space-y-4"
              style={{ backgroundColor: customColors.bgSolid, color: customColors.textPrimary }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: customColors.accent }}
                  >
                    🌸
                  </div>
                  <span className="font-bold text-xs">Today's Reflection</span>
                </div>
                <button
                  className="px-3 py-1 rounded-xl text-white text-xs font-semibold shadow-xs"
                  style={{ backgroundColor: customColors.buttonPrimary }}
                >
                  Save Entry
                </button>
              </div>

              <div
                className="p-3 rounded-2xl text-xs border border-black/5"
                style={{ backgroundColor: customColors.aiBubble }}
              >
                <p className="font-bold mb-1">Gemini AI</p>
                <p className="text-[11px] leading-relaxed">
                  "Your thoughts today carry calm clarity and intentional focus."
                </p>
              </div>

              <div
                className="p-3 rounded-2xl text-xs text-white self-end max-w-[80%]"
                style={{ backgroundColor: customColors.userBubble }}
              >
                <p className="text-[11px]">Feeling thankful for a mindful afternoon tea 🍵</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Typography & Paper Patterns */}
      {activeSubTab === 'typography' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Typography Controls */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                <Type className="w-4 h-4 text-pink-500" />
                <span>Font Family</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">Choose your preferred writing typeface</p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateSettings({ fontFamily: 'sans' })}
                  className={`p-3 rounded-2xl border text-center font-sans transition-all cursor-pointer ${
                    settings.fontFamily === 'sans'
                      ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold">Sans</div>
                  <div className="text-[10px] text-slate-400">Clean & Modern</div>
                </button>

                <button
                  onClick={() => updateSettings({ fontFamily: 'serif' })}
                  className={`p-3 rounded-2xl border text-center font-serif transition-all cursor-pointer ${
                    settings.fontFamily === 'serif'
                      ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold">Serif</div>
                  <div className="text-[10px] text-slate-400">Literary & Elegant</div>
                </button>

                <button
                  onClick={() => updateSettings({ fontFamily: 'mono' })}
                  className={`p-3 rounded-2xl border text-center font-mono transition-all cursor-pointer ${
                    settings.fontFamily === 'mono'
                      ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold">Mono</div>
                  <div className="text-[10px] text-slate-400">Typewriter Style</div>
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">Writing Font Size</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateSettings({ fontSize: 'sm' })}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    settings.fontSize === 'sm'
                      ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs">Compact (14px)</span>
                </button>

                <button
                  onClick={() => updateSettings({ fontSize: 'base' })}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    settings.fontSize === 'base'
                      ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-sm">Standard (16px)</span>
                </button>

                <button
                  onClick={() => updateSettings({ fontSize: 'lg' })}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    settings.fontSize === 'lg'
                      ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-base">Large (18px)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Paper Background Patterns */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Grid className="w-4 h-4 text-purple-500" />
              <span>Canvas Paper Texture</span>
            </h2>
            <p className="text-xs text-slate-400">Subtle tactile textures for your writing desk</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSettings({ backgroundPattern: 'none' })}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  settings.backgroundPattern === 'none'
                    ? 'border-pink-500 bg-pink-50 font-bold text-pink-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold mb-1">Clean Slate</div>
                <div className="text-[10px] text-slate-400">Pure minimal surface</div>
              </button>

              <button
                onClick={() => updateSettings({ backgroundPattern: 'dots' })}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  settings.backgroundPattern === 'dots'
                    ? 'border-pink-500 bg-pink-50 font-bold text-pink-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold mb-1">Dot Grid (Bullet)</div>
                <div className="text-[10px] text-slate-400">Subtle dot matrix</div>
              </button>

              <button
                onClick={() => updateSettings({ backgroundPattern: 'grid' })}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  settings.backgroundPattern === 'grid'
                    ? 'border-pink-500 bg-pink-50 font-bold text-pink-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold mb-1">Soft Grid</div>
                <div className="text-[10px] text-slate-400">Quadrille notebook</div>
              </button>

              <button
                onClick={() => updateSettings({ backgroundPattern: 'lines' })}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  settings.backgroundPattern === 'lines'
                    ? 'border-pink-500 bg-pink-50 font-bold text-pink-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold mb-1">Ruled Paper</div>
                <div className="text-[10px] text-slate-400">Classic diary lines</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
