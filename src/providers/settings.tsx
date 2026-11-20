import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { Mode } from '@/game/engine';
import type { MazeId } from '@/game/mazes';
import { addScore, addStats, EMPTY_STATS, type ScoreEntry, type Stats } from '@/game/records';
import { setHapticsEnabled } from '@/game/haptics';
import { setSoundEnabled } from '@/game/sound';
import { palette, SKINS, type ColorScheme, type SkinId, type ThemeColors } from '@/theme/tokens';

export type Controls = 'swipe' | 'dpad' | 'both';
export type ThemePref = 'system' | 'light' | 'dark';

export type Settings = {
  mode: Mode;
  maze: MazeId;
  level: number;
  skin: SkinId;
  controls: Controls;
  sound: boolean;
  haptics: boolean;
  theme: ThemePref;
  showGrid: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  mode: 'classic',
  maze: 'box',
  level: 5,
  skin: 'neon',
  controls: 'both',
  sound: true,
  haptics: true,
  theme: 'system',
  showGrid: true,
};

/** Storage keys are permanent: renaming one silently loses players' data. */
const KEYS = { settings: 'mero-snake/settings', scores: 'mero-snake/scores', stats: 'mero-snake/stats' } as const;

type Ctx = {
  loaded: boolean;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  scores: ScoreEntry[];
  stats: Stats;
  recordGame: (entry: ScoreEntry, bonus: number) => void;
  resetRecords: () => void;
  colors: ThemeColors;
  scheme: ColorScheme;
};

const SettingsContext = createContext<Ctx | null>(null);

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, list, st] = await Promise.all([
        readJson(KEYS.settings, DEFAULT_SETTINGS),
        readJson<{ list: ScoreEntry[] }>(KEYS.scores, { list: [] }),
        readJson(KEYS.stats, EMPTY_STATS),
      ]);
      if (!alive) return;
      // Drop values saved by a future version that this build does not know.
      if (!SKINS[s.skin]) s.skin = DEFAULT_SETTINGS.skin;
      setSettings(s);
      setScores(Array.isArray(list.list) ? list.list : []);
      setStats(st);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);
  useEffect(() => setHapticsEnabled(settings.haptics), [settings.haptics]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJson(KEYS.settings, next);
      return next;
    });
  }, []);

  const recordGame = useCallback((entry: ScoreEntry, bonus: number) => {
    setScores((prev) => {
      const next = addScore(prev, entry);
      writeJson(KEYS.scores, { list: next });
      return next;
    });
    setStats((prev) => {
      const next = addStats(prev, entry, bonus);
      writeJson(KEYS.stats, next);
      return next;
    });
  }, []);

  const resetRecords = useCallback(() => {
    setScores([]);
    setStats(EMPTY_STATS);
    AsyncStorage.multiRemove([KEYS.scores, KEYS.stats]).catch(() => {});
  }, []);

  const scheme: ColorScheme = settings.theme === 'system' ? (system === 'light' ? 'light' : 'dark') : settings.theme;

  const value = useMemo(
    () => ({ loaded, settings, update, scores, stats, recordGame, resetRecords, colors: palette[scheme], scheme }),
    [loaded, settings, update, scores, stats, recordGame, resetRecords, scheme]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

export function useTheme(): ThemeColors {
  return useSettings().colors;
}
