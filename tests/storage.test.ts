import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadStored, removeStored, saveStored } from '../src/utils/storage'

function stubStorage() {
  const values = new Map<string, string>()
  vi.stubGlobal('window', { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value), removeItem: (key: string) => void values.delete(key) } })
  return values
}
const read = (values: Map<string, string>, key: string) => JSON.parse(values.get(key) ?? '{}') as { _versao?: number; data?: unknown }

afterEach(() => vi.unstubAllGlobals())

describe('versioned localStorage (_versao)', () => {
  it('writes the data inside an envelope with the schema version', () => {
    const values = stubStorage()
    saveStored('k', { a: 1 }, 3)
    expect(read(values, 'k')).toEqual({ _versao: 3, data: { a: 1 } })
    expect(loadStored('k', { version: 3 })).toEqual({ a: 1 })
  })

  it('migrates an older version and stores the result with the current one', () => {
    const values = stubStorage()
    values.set('k', JSON.stringify({ _versao: 1, data: { old: true } }))
    expect(loadStored('k', { version: 2, migrations: { 1: () => ({ migrated: true }) } })).toEqual({ migrated: true })
    expect(read(values, 'k')._versao).toBe(2)
  })

  it('discards, and removes, what it cannot read safely', () => {
    const values = stubStorage()
    const cases: Array<[string, string]> = [
      ['corrupted JSON', '{'],
      ['no version', JSON.stringify({ a: 1 })],
      ['a version nobody migrates', JSON.stringify({ _versao: 7, data: { a: 1 } })],
      ['a migration that gives up', JSON.stringify({ _versao: 1, data: { a: 1 } })],
      ['the right version with the wrong shape', JSON.stringify({ _versao: 2, data: { a: 'x' } })],
    ]
    for (const [label, raw] of cases) {
      values.set('k', raw)
      const result = loadStored<{ a: number }>('k', { version: 2, migrations: { 1: () => null }, validate: (data) => (typeof (data as { a?: unknown })?.a === 'number' ? (data as { a: number }) : null) })
      expect(result, label).toBeNull()
      expect(values.has('k'), label).toBe(false)
    }
  })

  it('returns null when nothing is stored, and never throws when storage is blocked', () => {
    stubStorage()
    expect(loadStored('missing', { version: 1 })).toBeNull()
    const blocked = () => { throw new Error('blocked') }
    vi.stubGlobal('window', { localStorage: { getItem: blocked, setItem: blocked, removeItem: blocked } })
    expect(() => saveStored('k', 1, 1)).not.toThrow()
    expect(() => removeStored('k')).not.toThrow()
    expect(loadStored('k', { version: 1 })).toBeNull()
  })
})
