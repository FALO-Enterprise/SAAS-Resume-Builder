'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  ReactNode,
} from 'react';
import {
  DEFAULT_MODE,
  FALLBACK_THEME,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  getSystemTheme,
  readStoredMode,
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from '@/lib/theme';

export type { ResolvedTheme, ThemeMode };

interface ThemeContextType {
  /** The user's preference — `system` follows the OS. */
  themeMode: ThemeMode;
  /** The theme actually applied to the document. Never `system`. */
  resolvedTheme: ResolvedTheme;
  /** Alias of `resolvedTheme`, kept so existing `theme === 'dark'` checks keep working. */
  theme: ResolvedTheme;
  /** The OS preference, regardless of the selected mode. */
  systemTheme: ResolvedTheme;
  /** False during SSR and the hydration render, true once real values are readable. */
  mounted: boolean;
  setTheme: (mode: ThemeMode) => void;
  /** Flips between light and dark, leaving `system` mode if it was active. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

/* --- The OS preference, as an external store --- */

function subscribeToSystemTheme(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const media = window.matchMedia(THEME_MEDIA_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/* --- The stored preference, as an external store ---
   localStorage is not reactive, so writes here notify subscribers directly and
   `storage` events carry changes made in other tabs. Snapshots are plain
   strings, so `Object.is` comparison keeps re-renders correct. */

const modeListeners = new Set<() => void>();

function emitModeChange() {
  for (const listener of modeListeners) listener();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key === THEME_STORAGE_KEY) emitModeChange();
}

function subscribeToStoredMode(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  if (modeListeners.size === 0) {
    window.addEventListener('storage', handleStorageEvent);
  }
  modeListeners.add(onChange);
  return () => {
    modeListeners.delete(onChange);
    if (modeListeners.size === 0) {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

/* --- Mount detection, without a state-setting effect --- */

const neverChanges = () => () => {};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server snapshots keep the hydration render identical to the server HTML.
  // The visible theme is already correct by then — THEME_INIT_SCRIPT applied it
  // before first paint.
  const themeMode = useSyncExternalStore(
    subscribeToStoredMode,
    readStoredMode,
    () => DEFAULT_MODE,
  );

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => FALLBACK_THEME,
  );

  const mounted = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );

  const resolvedTheme = resolveTheme(themeMode, systemTheme);

  useEffect(() => {
    // Before mount these are still SSR snapshots — writing them would undo the
    // correct value the pre-paint script already applied.
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [mounted, resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage blocked (private mode); the preference just won't persist.
    }
    emitModeChange();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      themeMode,
      resolvedTheme,
      theme: resolvedTheme,
      systemTheme,
      mounted,
      setTheme,
      toggleTheme,
    }),
    [themeMode, resolvedTheme, systemTheme, mounted, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
