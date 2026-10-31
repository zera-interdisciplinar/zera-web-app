import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigationItems } from '../../src/utils/navigation'
import { applyPreferences, defaultPreferences, loadPreferences, PREFERENCES_VERSION, preferencesSchema, savePreferences, TEXT_SCALES } from '../../src/utils/accessibilityPreferences'

const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8')

const KEY = 'zera.a11y'

function fakeStorage(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[KEY, initial]])
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) }, removeItem: (key: string) => { data.delete(key) }, data }
}
const envelope = (data: unknown, version = PREFERENCES_VERSION) => JSON.stringify({ _versao: version, data })

afterEach(() => vi.unstubAllGlobals())

describe('preferences', () => {
  it('starts from the system settings (prefers-contrast and prefers-reduced-motion)', () => {
    expect(defaultPreferences({ prefersMoreContrast: true, prefersReducedMotion: true })).toMatchObject({ highContrast: true, reduceMotion: true, textScale: 100 })
    expect(defaultPreferences()).toMatchObject({ highContrast: false, reduceMotion: false })
  })

  it.each(TEXT_SCALES)('accepts the text scale %s%%', (scale) => {
    expect(preferencesSchema.safeParse({ ...defaultPreferences(), textScale: scale }).success).toBe(true)
  })

  it.each([90, 101, 250, '100', null])('rejects the text scale %j', (scale) => {
    expect(preferencesSchema.safeParse({ ...defaultPreferences(), textScale: scale }).success).toBe(false)
  })

  it('falls back to the defaults for corrupted or foreign stored values', () => {
    const fallback = defaultPreferences()
    const unversioned = JSON.stringify({ ...defaultPreferences(), textScale: 150 })
    for (const stored of ['not json', unversioned, '[]', 'null', envelope({ textScale: 300 }), envelope({ ...defaultPreferences(), highContrast: 'sim' }), envelope(defaultPreferences(), PREFERENCES_VERSION + 1)]) {
      const storage = fakeStorage(stored)
      vi.stubGlobal('window', { localStorage: storage })
      expect(loadPreferences(fallback), stored).toEqual(fallback)
      // What cannot be used is removed, so it is not read again on every start.
      expect(storage.data.has(KEY), stored).toBe(false)
    }
  })

  it('round-trips valid preferences and survives blocked storage', () => {
    const storage = fakeStorage()
    vi.stubGlobal('window', { localStorage: storage })
    const chosen = { ...defaultPreferences(), textScale: 150, readableFont: true }
    savePreferences(chosen)
    expect(JSON.parse(storage.data.get(KEY) ?? '{}')._versao).toBe(PREFERENCES_VERSION)
    expect(loadPreferences(defaultPreferences())).toEqual(chosen)
    vi.stubGlobal('window', { localStorage: { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } } })
    expect(() => savePreferences(chosen)).not.toThrow()
    expect(loadPreferences(defaultPreferences())).toEqual(defaultPreferences())
  })

  it('reflects each preference on the root element', () => {
    const root = { style: { fontSize: '' }, dataset: {} as Record<string, string> } as unknown as HTMLElement
    applyPreferences({ textScale: 200, highContrast: true, textSpacing: true, reduceMotion: true, readableFont: true, readingGuide: false }, root)
    expect(root.style.fontSize).toBe('200%')
    expect(root.dataset).toEqual({ contrast: 'high', spacing: 'wide', motion: 'reduced', font: 'readable' })
    applyPreferences(defaultPreferences(), root)
    expect(root.dataset).toEqual({ contrast: 'normal', spacing: 'normal', motion: 'normal', font: 'default' })
  })
})

describe('global stylesheet', () => {
  it('uses a real reading font instead of Comic Sans (A-2)', () => {
    expect(css).not.toMatch(/Comic Sans|Trebuchet/)
    expect(css).toContain("html[data-font='readable']")
    expect(css).toContain('var(--fonte-acessivel)')
  })

  it('applies the WCAG 1.4.12 text spacing values (A-3)', () => {
    const block = css.slice(css.indexOf("html[data-spacing='wide'] body"))
    expect(block).toContain('letter-spacing: 0.12em')
    expect(block).toContain('word-spacing: 0.16em')
    expect(block).toContain('line-height: 1.5 !important')
    expect(block).toContain('margin-block-end: 2em')
  })

  it('drops the focus mode and the color-blindness simulation (A-6, A-7)', () => {
    expect(css).not.toMatch(/modo-foco|simulacao-cores|protanopia|deuteranopia|tritanopia/)
  })

  it('has high contrast and reduced motion switches that redefine tokens or disable animation (A-5, A-6)', () => {
    expect(css).toContain("html[data-contrast='high']")
    expect(css).toContain('--color-text: #000')
    expect(css).toMatch(/html\[data-motion='reduced'\][^{]*\{[^}]*animation: none !important/)
  })
})

describe('voice commands (A-8)', () => {
  it('come from the navigation items the sidebar shows, with no stale routes', () => {
    expect(navigationItems.map((item) => item.path)).toEqual(['/', '/itens', '/modelos', '/configuracoes'])
    const panel = readFileSync(new URL('../../src/components/AccessibilityPanel/index.tsx', import.meta.url), 'utf8')
    for (const stale of ['recicladoras', 'funcionários', 'relatórios', 'login']) expect(panel).not.toContain(stale)
  })
})
