import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemePalette, CustomTheme, UserSettings } from '../types';
import { PRESET_PALETTES, SEASONAL_PALETTES, getCurrentSeason } from '../data/palettes';
import { useAuth } from './authContext';
import { subscribeToUserSettings, saveUserSettings, DEFAULT_USER_SETTINGS } from './storage';

interface ThemeContextType {
  palette: ThemePalette;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  selectTheme: (themeId: string) => Promise<void>;
  saveCustomTheme: (customTheme: CustomTheme) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  allPalettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_USER_SETTINGS);
      return;
    }

    const unsubscribe = subscribeToUserSettings(user.uid, (loadedSettings) => {
      setSettings(loadedSettings);
    });

    return () => unsubscribe();
  }, [user]);

  // Compute active ThemePalette
  const getActivePalette = (): ThemePalette => {
    // 1. If seasonal theme is enabled or explicitly set to auto-seasonal
    if (settings.seasonalThemeEnabled || settings.activeThemeId === 'seasonal-auto' || settings.activeThemeId === 'seasonal') {
      const season = getCurrentSeason();
      return SEASONAL_PALETTES[season] || PRESET_PALETTES[0];
    }

    // 2. Check if a specific seasonal palette was selected
    const seasonalMatch = Object.values(SEASONAL_PALETTES).find(
      (p) => p.id === settings.activeThemeId || p.season === settings.activeThemeId || `seasonal-${p.season}` === settings.activeThemeId
    );
    if (seasonalMatch) return seasonalMatch;

    // 3. Check in preset palettes (handling legacy winter alias to nordic-frost)
    const foundPreset = PRESET_PALETTES.find(
      (p) => p.id === settings.activeThemeId || (settings.activeThemeId === 'winter' && p.id === 'nordic-frost')
    );
    if (foundPreset) return foundPreset;

    // 4. Check in custom themes
    const foundCustom = settings.customThemes.find((ct) => ct.id === settings.activeThemeId);
    if (foundCustom) {
      return {
        id: foundCustom.id,
        name: foundCustom.name,
        category: 'custom',
        bgGradient: 'from-slate-50 to-stone-100',
        bgSolid: foundCustom.bg,
        cardBg: foundCustom.cardBg,
        cardBorder: foundCustom.borderColor,
        textPrimary: foundCustom.textColor,
        textSecondary: foundCustom.textMuted,
        accent: foundCustom.accentColor,
        accentHover: foundCustom.accentColor,
        accentLight: foundCustom.aiBubbleBg,
        aiBubble: foundCustom.aiBubbleBg,
        userBubble: foundCustom.userBubbleBg,
        buttonPrimary: foundCustom.buttonBg,
        badgeBg: foundCustom.borderColor,
      };
    }

    // Default fallback
    return PRESET_PALETTES[0];
  };

  const palette = getActivePalette();

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
      setSettings((prev) => ({ ...prev, ...newSettings }));
      return;
    }
    await saveUserSettings(user.uid, newSettings);
  };

  const selectTheme = async (themeId: string) => {
    if (themeId === 'seasonal-auto') {
      await updateSettings({
        activeThemeId: 'seasonal-auto',
        seasonalThemeEnabled: true,
      });
      return;
    }

    // If user clicked on a specific seasonal palette
    const isSpecificSeasonal = Object.values(SEASONAL_PALETTES).some(
      (p) => p.id === themeId || p.season === themeId || `seasonal-${p.season}` === themeId
    );

    if (isSpecificSeasonal) {
      await updateSettings({
        activeThemeId: themeId,
        seasonalThemeEnabled: false,
      });
      return;
    }

    // User selected a standard preset or custom theme
    await updateSettings({
      activeThemeId: themeId,
      seasonalThemeEnabled: false,
    });
  };

  const saveCustomTheme = async (customTheme: CustomTheme) => {
    const existing = settings.customThemes.filter((t) => t.id !== customTheme.id);
    const updated = [...existing, customTheme];
    await updateSettings({
      customThemes: updated,
      activeThemeId: customTheme.id,
    });
  };

  const deleteCustomTheme = async (themeId: string) => {
    const updated = settings.customThemes.filter((t) => t.id !== themeId);
    let newActive = settings.activeThemeId;
    if (newActive === themeId) {
      newActive = 'sakura';
    }
    await updateSettings({
      customThemes: updated,
      activeThemeId: newActive,
    });
  };

  // Compile all available palettes list
  const customPalettes: ThemePalette[] = settings.customThemes.map((ct) => ({
    id: ct.id,
    name: ct.name,
    category: 'custom',
    bgGradient: 'from-slate-50 to-stone-100',
    bgSolid: ct.bg,
    cardBg: ct.cardBg,
    cardBorder: ct.borderColor,
    textPrimary: ct.textColor,
    textSecondary: ct.textMuted,
    accent: ct.accentColor,
    accentHover: ct.accentColor,
    accentLight: ct.aiBubbleBg,
    aiBubble: ct.aiBubbleBg,
    userBubble: ct.userBubbleBg,
    buttonPrimary: ct.buttonBg,
    badgeBg: ct.borderColor,
  }));

  const allPalettes = [
    ...PRESET_PALETTES,
    ...Object.values(SEASONAL_PALETTES),
    ...customPalettes,
  ];

  return (
    <ThemeContext.Provider
      value={{
        palette,
        settings,
        updateSettings,
        selectTheme,
        saveCustomTheme,
        deleteCustomTheme,
        allPalettes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
