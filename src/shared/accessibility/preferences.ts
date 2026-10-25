import { z } from 'zod'

export const TEXT_SCALES = [100, 115, 130, 150, 200] as const

export const preferencesSchema = z.object({
  textScale: z.number().refine((value) => (TEXT_SCALES as readonly number[]).includes(value), 'unsupported scale'),
  highContrast: z.boolean(),
  textSpacing: z.boolean(),
  reduceMotion: z.boolean(),
  readableFont: z.boolean(),
  readingGuide: z.boolean(),
})
export type Preferences = z.infer<typeof preferencesSchema>

export interface SystemPreferences {
  prefersMoreContrast: boolean
  prefersReducedMotion: boolean
}

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

const KEY = 'zera.a11y.v1'

/** A corrupted or foreign value falls back to the defaults instead of breaking the page. */
export function loadPreferences(fallback: Preferences): Preferences {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed = preferencesSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(preferences))
  } catch {
    // Private mode or blocked storage: the choice just will not outlive the tab.
  }
}

/** Reflects the preferences on <html>, where the global stylesheet reads them. */
export function applyPreferences(preferences: Preferences, root: HTMLElement = document.documentElement): void {
  root.style.fontSize = `${preferences.textScale}%`
  root.dataset.contrast = preferences.highContrast ? 'high' : 'normal'
  root.dataset.spacing = preferences.textSpacing ? 'wide' : 'normal'
  root.dataset.motion = preferences.reduceMotion ? 'reduced' : 'normal'
  root.dataset.font = preferences.readableFont ? 'readable' : 'default'
}
