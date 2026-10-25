import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigationItems } from '../../src/app/navigation'
import { applyPreferences, defaultPreferences, loadPreferences, preferencesSchema, savePreferences, TEXT_SCALES } from '../../src/shared/accessibility/preferences'

const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8')

function fakeStorage(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [['zera.a11y.v1', initial]])
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) }, data }
}

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
    for (const stored of ['not json', '{"textScale":300}', '[]', 'null', '{"highContrast":"sim"}']) {
      vi.stubGlobal('window', { localStorage: fakeStorage(stored) })
      expect(loadPreferences(fallback)).toEqual(fallback)
    }
  })

  it('round-trips valid preferences and survives blocked storage', () => {
    const storage = fakeStorage()
    vi.stubGlobal('window', { localStorage: storage })
    const chosen = { ...defaultPreferences(), textScale: 150, readableFont: true }
    savePreferences(chosen)
    expect(loadPreferences(defaultPreferences())).toEqual(chosen)
    vi.stubGlobal('window', { localStorage: { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } } })
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
    expect(navigationItems.map((item) => item.path)).toEqual(['/', '/itens', '/modelos'])
    const panel = readFileSync(new URL('../../src/shared/accessibility/AccessibilityPanel.tsx', import.meta.url), 'utf8')
    for (const stale of ['recicladoras', 'funcionários', 'relatórios', 'configurações', 'login']) expect(panel).not.toContain(stale)
  })
})
