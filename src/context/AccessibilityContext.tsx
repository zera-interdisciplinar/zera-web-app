import { createContext, useEffect, useMemo, useReducer } from 'react'
import { applyPreferences, defaultPreferences, loadPreferences, readSystemPreferences, savePreferences } from '../utils/accessibilityPreferences'
import type { ProviderProps } from '../types/componentes/Provider'
import type { Preferences } from '../types/accessibility'
import type { AccessibilityValue } from '../types/accessibility'

export const AccessibilityContext = createContext<AccessibilityValue | null>(null)

type Action = { type: 'update'; changes: Partial<Preferences> } | { type: 'reset'; defaults: Preferences }

function reducer(state: Preferences, action: Action): Preferences {
  return action.type === 'reset' ? action.defaults : { ...state, ...action.changes }
}

export function AccessibilityProvider({ children }: ProviderProps) {
  const [preferences, dispatch] = useReducer(reducer, undefined, () => loadPreferences(defaultPreferences(readSystemPreferences())))

  useEffect(() => {
    applyPreferences(preferences)
    savePreferences(preferences)
  }, [preferences])

  useEffect(() => {
    // The readable font is only downloaded when someone asks for it.
    if (preferences.readableFont) void import('@fontsource/atkinson-hyperlegible/latin-400.css').then(() => import('@fontsource/atkinson-hyperlegible/latin-700.css'))
  }, [preferences.readableFont])

  // Keeps the context value stable between renders that do not change the preferences.
  const value = useMemo<AccessibilityValue>(() => ({
    preferences,
    update: (changes) => dispatch({ type: 'update', changes }),
    reset: () => dispatch({ type: 'reset', defaults: defaultPreferences(readSystemPreferences()) }),
  }), [preferences])

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}
