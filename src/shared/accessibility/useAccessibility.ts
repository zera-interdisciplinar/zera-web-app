import { useContext } from 'react'
import { AccessibilityContext, type AccessibilityValue } from './AccessibilityProvider'

export function useAccessibility(): AccessibilityValue {
  const value = useContext(AccessibilityContext)
  if (!value) throw new Error('useAccessibility must be used inside <AccessibilityProvider>.')
  return value
}
