import type { ReactNode } from 'react'

/** `aria-describedby` for a field: points at the error and the hint when they are on screen. */
export function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  return [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined
}
