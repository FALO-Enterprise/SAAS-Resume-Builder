/**
 * User preferences that live purely on the client.
 *
 * There is no preferences table in the database — the Prisma `User` model has
 * no settings columns at all — so these are stored in localStorage under a
 * single JSON key. If a server-side store is added later, this module is the
 * only place that has to learn about it.
 *
 * Every preference here must actually DO something. Controls that persist a
 * value nothing reads are worse than no control at all, because they read as
 * working. See `docs`-worthy note in the settings modal for what was removed.
 */

export type ExportFormatPreference = 'pdf' | 'jpg';

export interface NotificationPreferences {
  resumeExported: boolean;
  securityAlerts: boolean;
  weeklyTips: boolean;
  productUpdates: boolean;
}

export interface Preferences {
  /** Suppresses non-essential motion app-wide. Also honours the OS setting. */
  reduceMotion: boolean;
  /** Pre-selects the format in the resume export picker. */
  defaultExportFormat: ExportFormatPreference;
  notifications: NotificationPreferences;
}

export const PREFERENCES_STORAGE_KEY = 'resumax_preferences';
export const REDUCE_MOTION_ATTRIBUTE = 'data-reduce-motion';

export const DEFAULT_PREFERENCES: Preferences = {
  reduceMotion: false,
  defaultExportFormat: 'pdf',
  notifications: {
    resumeExported: true,
    securityAlerts: true,
    weeklyTips: false,
    productUpdates: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Merges stored values over the defaults field by field, so a partial, stale
 * or hand-edited blob can never produce an undefined preference.
 */
export function normalizePreferences(raw: unknown): Preferences {
  if (!isRecord(raw)) return DEFAULT_PREFERENCES;

  const notifications = isRecord(raw.notifications) ? raw.notifications : {};

  return {
    reduceMotion: coerceBoolean(raw.reduceMotion, DEFAULT_PREFERENCES.reduceMotion),
    defaultExportFormat:
      raw.defaultExportFormat === 'jpg' || raw.defaultExportFormat === 'pdf'
        ? raw.defaultExportFormat
        : DEFAULT_PREFERENCES.defaultExportFormat,
    notifications: {
      resumeExported: coerceBoolean(
        notifications.resumeExported,
        DEFAULT_PREFERENCES.notifications.resumeExported,
      ),
      securityAlerts: coerceBoolean(
        notifications.securityAlerts,
        DEFAULT_PREFERENCES.notifications.securityAlerts,
      ),
      weeklyTips: coerceBoolean(
        notifications.weeklyTips,
        DEFAULT_PREFERENCES.notifications.weeklyTips,
      ),
      productUpdates: coerceBoolean(
        notifications.productUpdates,
        DEFAULT_PREFERENCES.notifications.productUpdates,
      ),
    },
  };
}

export function readStoredPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    return normalizePreferences(JSON.parse(stored));
  } catch {
    // Blocked storage or corrupt JSON — fall back rather than crash the app.
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Applies reduce-motion before first paint, so mount animations never get a
 * chance to run for someone who asked not to see them.
 */
export const PREFERENCES_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  PREFERENCES_STORAGE_KEY,
)});if(!s)return;var p=JSON.parse(s);if(p&&p.reduceMotion===true){document.documentElement.setAttribute(${JSON.stringify(
  REDUCE_MOTION_ATTRIBUTE,
)},"true");}}catch(e){}})();`;
