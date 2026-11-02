import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { preparePages } from '../scripts/prepare-pages.mjs'

const read = (path: string) => readFileSync(path, 'utf8')

describe('GitHub Pages publication', () => {
  it('copies index.html to 404.html (so F5 on a route works) and adds .nojekyll', () => {
    const dist = mkdtempSync(join(tmpdir(), 'zera-pages-'))
    try {
      writeFileSync(join(dist, 'index.html'), '<!doctype html><title>Zera</title>')
      preparePages(dist)
      expect(read(join(dist, '404.html'))).toBe(read(join(dist, 'index.html')))
      expect(existsSync(join(dist, '.nojekyll'))).toBe(true)
    } finally {
      rmSync(dist, { recursive: true, force: true })
    }
  })

  it('refuses to run before the build', () => {
    const dist = mkdtempSync(join(tmpdir(), 'zera-pages-'))
    try {
      mkdirSync(join(dist, 'assets'))
      expect(() => preparePages(dist)).toThrow(/run the build first/)
    } finally {
      rmSync(dist, { recursive: true, force: true })
    }
  })

  it('the router follows the base path the app is served from', () => {
    expect(read('src/App.tsx')).toContain('<BrowserRouter basename={import.meta.env.BASE_URL}>')
  })

  it('the workflow builds under the repository path, needs https API addresses and is independent of the GKE deploy', () => {
    const workflow = read('.github/workflows/pages.yml')
    expect(workflow).toMatch(/branches: \[main\]/)
    expect(workflow).toContain('--base=/${{ github.event.repository.name }}/')
    expect(workflow).toContain('node scripts/prepare-pages.mjs')
    expect(workflow).toContain('actions/deploy-pages@v4')
    for (const name of ['VITE_ADMIN_API_URL', 'VITE_INVENTORY_API_URL', 'VITE_API_BASE_URL']) expect(workflow).toContain(`${name}: \${{ vars.${name} }}`)
    expect(workflow).toContain('must be an https URL')
    // The GKE pipeline is untouched by this change: it still builds without --base and with same-origin API paths.
    expect(read('Dockerfile')).not.toContain('--base')
    expect(read('Dockerfile')).toContain('VITE_ADMIN_API_URL=/api/administrative')
    expect(read('.github/workflows/deploy-web.yml')).not.toContain('pages')
  })

  it('the README tells how to set it up for production (source, variables)', () => {
    const readme = read('README.md')
    expect(readme).toContain('https://zera-interdisciplinar.github.io/zera-web-app/')
    expect(readme).toContain('GitHub Actions')
    expect(readme).toContain('https://gestao.zeratech.online/api/administrative')
    expect(readme).toContain('somente produção')
  })

  it('only the production proxy accepts calls from the Pages site; QA stays as it was', () => {
    const origins = (overlay: string) => read(`k8s/overlays/${overlay}/kustomization.yaml`).match(/ZERA_WEB_ORIGINS=(\S+)/)?.[1].split(',')
    expect(origins('production')).toEqual(['https://gestao.zeratech.online', 'https://zera-interdisciplinar.github.io'])
    expect(origins('qa')).toEqual(['https://qa.zeratech.online'])
  })
})
