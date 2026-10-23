import { describe, expect, it } from 'vitest'
import { parseEnv } from '../../src/shared/config/env'

describe('parseEnv', () => {
  it('falls back to the same-origin proxy paths', () => {
    expect(parseEnv({}).apiBaseUrls).toEqual({ administrative: '/api/administrative', inventory: '/api/inventory', analytics: '/api/analytics' })
    expect(parseEnv({ VITE_ADMIN_API_URL: '  ' }).apiBaseUrls.administrative).toBe('/api/administrative')
  })

  it('normalizes trailing slashes and a trailing /api', () => {
    expect(parseEnv({ VITE_INVENTORY_API_URL: 'https://inventory.example.invalid/api/' }).apiBaseUrls.inventory).toBe('https://inventory.example.invalid')
    expect(parseEnv({ VITE_API_BASE_URL: '/api/analytics///' }).apiBaseUrls.analytics).toBe('/api/analytics')
  })

  it('accepts http only for localhost', () => {
    expect(parseEnv({ VITE_ADMIN_API_URL: 'http://localhost:8080' }).apiBaseUrls.administrative).toBe('http://localhost:8080')
    expect(() => parseEnv({ VITE_ADMIN_API_URL: 'http://remote.example.invalid' })).toThrow('VITE_ADMIN_API_URL')
  })

  it.each(['//evil.example.invalid', 'not a url', 'ftp://host.example.invalid', 'javascript:alert(1)'])('rejects %s', (value) => {
    expect(() => parseEnv({ VITE_INVENTORY_API_URL: value })).toThrow('Invalid environment configuration')
  })
})
