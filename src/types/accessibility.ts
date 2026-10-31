import type { z } from 'zod'
import type { preferencesSchema } from '../utils/accessibilityPreferences'

export interface AccessibilityValue {
  preferences: Preferences
  update: (changes: Partial<Preferences>) => void
  reset: () => void
}

export type Preferences = z.infer<typeof preferencesSchema>

export interface SystemPreferences {
  prefersMoreContrast: boolean
  prefersReducedMotion: boolean
}

export interface VoiceCommand {
  /** What the person says after "ir para", for example "itens". */
  phrase: string
  path: string
}
