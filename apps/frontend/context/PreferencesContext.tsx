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
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  REDUCE_MOTION_ATTRIBUTE,
  readStoredPreferences,
  type NotificationPreferences,
  type Preferences,
} from '@/lib/preferences';

interface PreferencesContextType {
  preferences: Preferences;
  /** False during SSR and the hydration render. */
  mounted: boolean;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  setNotification: (key: keyof NotificationPreferences, value: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

/* localStorage as an external store — same approach as ThemeContext, so both
   settings layers behave identically across tabs and during hydration.
   Snapshots are cached because `getSnapshot` must be referentially stable:
   parsing JSON on every render would hand React a new object each time and
   spin forever. */

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedValue: Preferences = DEFAULT_PREFERENCES;
let hasCache = false;

function getSnapshot(): Preferences {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (!hasCache || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = readStoredPreferences();
    hasCache = true;
  }
  return cachedValue;
}

function getServerSnapshot(): Preferences {
  return DEFAULT_PREFERENCES;
}

function emitChange() {
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key === PREFERENCES_STORAGE_KEY) emitChange();
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  if (listeners.size === 0) window.addEventListener('storage', handleStorageEvent);
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.removeEventListener('storage', handleStorageEvent);
  };
}

const neverChanges = () => () => {};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(neverChanges, () => true, () => false);

  const write = useCallback((next: Preferences) => {
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked — the change still applies for this session.
    }
    emitChange();
  }, []);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      write({ ...getSnapshot(), [key]: value });
    },
    [write],
  );

  const setNotification = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      const current = getSnapshot();
      write({ ...current, notifications: { ...current.notifications, [key]: value } });
    },
    [write],
  );

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (preferences.reduceMotion) {
      root.setAttribute(REDUCE_MOTION_ATTRIBUTE, 'true');
    } else {
      root.removeAttribute(REDUCE_MOTION_ATTRIBUTE);
    }
  }, [mounted, preferences.reduceMotion]);

  const value = useMemo<PreferencesContextType>(
    () => ({ preferences, mounted, setPreference, setNotification }),
    [preferences, mounted, setPreference, setNotification],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
