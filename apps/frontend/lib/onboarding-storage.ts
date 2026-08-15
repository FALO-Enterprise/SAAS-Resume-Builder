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

export function loadOnboardingState(userId?: string): StoredOnboardingState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(storageKey(userId));
    return stored ? JSON.parse(stored) as StoredOnboardingState : null;
  } catch {
    localStorage.removeItem(storageKey(userId));
    return null;
  }
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
