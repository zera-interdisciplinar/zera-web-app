import { z } from 'zod'
import { loadStored, saveStored } from './storage'
import type { SystemPreferences, Preferences } from '../types/accessibility'

export const TEXT_SCALES = [100, 115, 130, 150, 200] as const

export const preferencesSchema = z.object({
  textScale: z.number().refine((value) => (TEXT_SCALES as readonly number[]).includes(value), 'unsupported scale'),
  highContrast: z.boolean(),
  textSpacing: z.boolean(),
  reduceMotion: z.boolean(),
  readableFont: z.boolean(),
  readingGuide: z.boolean(),
})

export function defaultPreferences(system: SystemPreferences = { prefersMoreContrast: false, prefersReducedMotion: false }): Preferences {
  return {
    textScale: 100,
    highContrast: system.prefersMoreContrast,
    textSpacing: false,
    reduceMotion: system.prefersReducedMotion,
    readableFont: false,
    readingGuide: false,
  }
}

export function readSystemPreferences(): SystemPreferences {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return { prefersMoreContrast: false, prefersReducedMotion: false }
  return {
    prefersMoreContrast: window.matchMedia('(prefers-contrast: more)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

const KEY = 'zera.a11y'
/** Bump it when the shape of `Preferences` changes; add a migration for the old number if the data is worth keeping. */
export const PREFERENCES_VERSION = 1

const validate = (data: unknown): Preferences | null => {
  const parsed = preferencesSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

/** A missing, corrupted, foreign or old-version value falls back to the defaults instead of breaking the page. */
export function loadPreferences(fallback: Preferences): Preferences {
  return loadStored(KEY, { version: PREFERENCES_VERSION, validate }) ?? fallback
}

export function savePreferences(preferences: Preferences): void {
  saveStored(KEY, preferences, PREFERENCES_VERSION)
}

/** Reflects the preferences on <html>, where the global stylesheet reads them. */
export function applyPreferences(preferences: Preferences, root: HTMLElement = document.documentElement): void {
  root.style.fontSize = `${preferences.textScale}%`
  root.dataset.contrast = preferences.highContrast ? 'high' : 'normal'
  root.dataset.spacing = preferences.textSpacing ? 'wide' : 'normal'
  root.dataset.motion = preferences.reduceMotion ? 'reduced' : 'normal'
  root.dataset.font = preferences.readableFont ? 'readable' : 'default'
}
