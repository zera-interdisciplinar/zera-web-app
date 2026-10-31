import { useContext } from 'react'
import { AccessibilityContext } from '../context/AccessibilityContext'
import type { AccessibilityValue } from '../types/accessibility'

export function useAccessibility(): AccessibilityValue {
  const value = useContext(AccessibilityContext)
  if (!value) throw new Error('useAccessibility must be used inside <AccessibilityProvider>.')
  return value
}
