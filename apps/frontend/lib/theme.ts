

export type ThemeMode = 'light' | 'dark' | 'system';

export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'resumax_theme';
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const DEFAULT_MODE: ThemeMode = 'system';
export const FALLBACK_THEME: ResolvedTheme = 'dark';

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return FALLBACK_THEME;
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function resolveTheme(mode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
  return mode === 'system' ? systemTheme : mode;
}

export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var m=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(m!=="light"&&m!=="dark"&&m!=="system"){m=${JSON.stringify(
  DEFAULT_MODE,
)};}var t=m==="system"?(window.matchMedia(${JSON.stringify(
  THEME_MEDIA_QUERY,
)}).matches?"dark":"light"):m;d.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(
  FALLBACK_THEME,
)});}})();`;
