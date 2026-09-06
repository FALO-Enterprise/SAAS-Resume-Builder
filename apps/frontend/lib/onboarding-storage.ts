import type { OnboardingData } from './types/onboarding.types';

export type StoredOnboardingState = {
  answers: OnboardingData;
  currentStep: number;
  completed: boolean;
  dashboardSynced?: boolean;
};

// v6 adds a custom professional title while preserving the seven-step survey.
const STORAGE_PREFIX = 'resumax_onboarding_quick_survey_v6';

function storageKey(userId?: string) {
  return `${STORAGE_PREFIX}:${userId || 'current-user'}`;
}

function readStoredState(key: string): StoredOnboardingState | null {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as StoredOnboardingState : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function loadOnboardingState(userId?: string): StoredOnboardingState | null {
  if (typeof window === 'undefined') return null;
  const userSpecific = readStoredState(storageKey(userId));
  if (userSpecific) return userSpecific;
  if (userId) {
    return readStoredState(storageKey(undefined));
  }
  return null;
}

export function hasCompletedOnboarding(userId?: string) {
  const storedState = loadOnboardingState(userId);
  return Boolean(storedState?.completed && storedState.dashboardSynced);
}

export function saveOnboardingState(
  state: StoredOnboardingState,
  userId?: string,
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export function resetOnboardingState(userId?: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(userId));
}
