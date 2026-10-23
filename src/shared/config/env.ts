import { z } from 'zod'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

/** Accepts a same-origin path (`/api/inventory`) or an https URL; http only for localhost. */
function apiBase(fallback: string) {
  return z
    .string()
    .trim()
    .min(1)
    .default(fallback)
    .transform((value) => value.replace(/\/+$/, '').replace(/\/api$/i, ''))
    .refine((value) => {
      if (value.startsWith('/')) return !value.startsWith('//')
      try {
        const url = new URL(value)
        return url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.includes(url.hostname))
      } catch {
        return false
      }
    }, 'must be a same-origin path or an https URL')
}

const schema = z.object({
  VITE_ADMIN_API_URL: apiBase('/api/administrative'),
  VITE_INVENTORY_API_URL: apiBase('/api/inventory'),
  // Historical name: this variable has always held the analytics (BFF) base.
  VITE_API_BASE_URL: apiBase('/api/analytics'),
})

export interface AppEnv {
  apiBaseUrls: {
    administrative: string
    inventory: string
    analytics: string
  }
}

/** Parses the public Vite variables once; throws a readable error when one is invalid. */
export function parseEnv(raw: Record<string, unknown>): AppEnv {
  const parsed = schema.safeParse({
    VITE_ADMIN_API_URL: emptyToUndefined(raw.VITE_ADMIN_API_URL),
    VITE_INVENTORY_API_URL: emptyToUndefined(raw.VITE_INVENTORY_API_URL),
    VITE_API_BASE_URL: emptyToUndefined(raw.VITE_API_BASE_URL),
  })
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${String(issue.path[0])}: ${issue.message}`).join('; ')
    throw new Error(`Invalid environment configuration (${problems}).`)
  }
  return {
    apiBaseUrls: {
      administrative: parsed.data.VITE_ADMIN_API_URL,
      inventory: parsed.data.VITE_INVENTORY_API_URL,
      analytics: parsed.data.VITE_API_BASE_URL,
    },
  }
}

function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value
}

export const env: AppEnv = parseEnv(import.meta.env as unknown as Record<string, unknown>)
