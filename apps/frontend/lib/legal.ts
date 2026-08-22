import type { LegalSlug } from "./types/legal.types";

/**
 * Single source of truth for every jurisdiction- and entity-specific fact that
 * appears in the Privacy Policy and Terms & Conditions.
 *
 * Legal counsel can adjust any of these without touching document prose: the
 * content modules interpolate from here, so a change lands in both languages
 * and both documents at once.
 */
export const LEGAL_CONFIG = {
  /** Registered operating entity behind the ResuMax product. */
  entity: "FALO Enterprise",
  product: "ResuMax",
  domain: "resumax.io",

  contact: {
    /** Data-protection requests, erasure, access, portability. */
    privacy: "privacy@resumax.io",
    /** Contractual notices, disputes, IP claims. */
    legal: "legal@resumax.io",
    /** General product support. */
    support: "hello@resumax.io",
  },

  /**
   * Governing-law seat. ResuMax serves users worldwide, so the documents grant
   * GDPR-level rights to every user regardless of residence; this value only
   * controls the forum for contractual disputes.
   *
   * CONFIRM WITH COUNSEL — set to the entity's place of incorporation.
   */
  governingLaw: {
    en: "the United Arab Emirates",
    ar: "الإمارات العربية المتحدة",
  },
  forum: {
    en: "the courts of Dubai, United Arab Emirates",
    ar: "محاكم دبي، الإمارات العربية المتحدة",
  },

  /** Minimum age to hold an account. */
  minimumAge: 16,

  effectiveDate: "2026-08-19",
  lastUpdated: "2026-08-19",
} as const;

export type LegalConfig = typeof LEGAL_CONFIG;

/** Route segment each document lives at, under the locale prefix. */
export const LEGAL_ROUTES: Record<LegalSlug, string> = {
  privacy: "privacy",
  terms: "terms-and-conditions",
};

/** next-intl message key holding each document. */
export const LEGAL_MESSAGE_KEYS: Record<LegalSlug, string> = {
  privacy: "legal.privacy",
  terms: "legal.terms",
};

/** Path to a legal document for a given locale, e.g. `/ar/terms-and-conditions`. */
export function legalHref(slug: LegalSlug, locale: string): string {
  return `/${locale}/${LEGAL_ROUTES[slug]}`;
}
