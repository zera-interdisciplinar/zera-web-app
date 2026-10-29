import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('impede violações estáticas nos arquivos analisados pelo CI', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'zera-check-'))
  try {
    for (const dir of ['src/components', 'src/pages', 'src/hooks', 'styles', 'tests/fixtures']) mkdirSync(join(pasta, dir), { recursive: true })
    writeFileSync(join(pasta, 'styles/tokens.css'), '')
    writeFileSync(join(pasta, 'tests/fixtures/design-tokens.json'), '{"color":{}}')
    writeFileSync(join(pasta, 'src/hooks/violacoes.tsx'), `
      // @ts-ignore
      const valor = null as any
      function teste() {
        const { id } = useParams()
        const exemplo = useMemo(() => id, [])
        localStorage.getItem('x')
        window.location.href
        fetch('/x')
        alert('x')
        return <><img src="x" />{[1].map((x, posicao) => <span key={posicao}>{x}</span>)}</>
      }
    `)
    const resultado = spawnSync(process.execPath, [resolve('scripts/check-project.mjs')], { cwd: pasta, encoding: 'utf8' })
    expect(resultado.status).toBe(1)
    for (const aviso of ['@ts-ignore', 'tipo any', 'fetch fora de services', 'alert fora do DOM', 'window.location', 'localStorage fora', 'imagem sem alt', 'key usa índice de map', 'useMemo sem justificativa', 'parâmetro id sem guarda']) {
      expect(resultado.stderr).toContain(aviso)
    }
  } finally {
    if (pasta.startsWith(join(tmpdir(), 'zera-check-'))) rmSync(pasta, { recursive: true, force: true })
  }
})

it('aplica as regras de dependência das camadas novas (shared, msw, fetch)', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'zera-check-'))
  try {
    for (const dir of ['src/components', 'src/pages', 'src/shared/api', 'src/shared/ui', 'src/features/items', 'styles', 'tests/fixtures']) mkdirSync(join(pasta, dir), { recursive: true })
    writeFileSync(join(pasta, 'styles/tokens.css'), '')
    writeFileSync(join(pasta, 'tests/fixtures/design-tokens.json'), '{"color":{}}')
    // Permitido: fetch dentro de shared/api.
    writeFileSync(join(pasta, 'src/shared/api/client.ts'), "export const chamar = () => fetch('/x')\n")
    // Proibidos: shared importando features, fetch em shared/ui e msw em src.
    writeFileSync(join(pasta, 'src/shared/ui/Botao.ts'), "import { x } from '../../features/items'\nimport { http } from 'msw'\nexport const y = () => fetch('/y')\n")
    const resultado = spawnSync(process.execPath, [resolve('scripts/check-project.mjs')], { cwd: pasta, encoding: 'utf8' })
    expect(resultado.status).toBe(1)
    expect(resultado.stderr).toContain('src/shared/ui/Botao.ts: shared importa features ou app')
    expect(resultado.stderr).toContain('src/shared/ui/Botao.ts: msw só é permitido em tests/')
    expect(resultado.stderr).toContain('src/shared/ui/Botao.ts: fetch fora de services')
    expect(resultado.stderr).not.toContain('src/shared/api/client.ts')
  } finally {
    if (pasta.startsWith(join(tmpdir(), 'zera-check-'))) rmSync(pasta, { recursive: true, force: true })
  }
})

it('impede que uma feature importe app, routes ou outra feature fora das dependências declaradas', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'zera-check-'))
  try {
    for (const dir of ['src/components', 'src/pages', 'src/app', 'src/features/items', 'src/features/models', 'src/features/settings', 'src/features/dashboard', 'styles', 'tests/fixtures']) mkdirSync(join(pasta, dir), { recursive: true })
    writeFileSync(join(pasta, 'styles/tokens.css'), '')
    writeFileSync(join(pasta, 'tests/fixtures/design-tokens.json'), '{"color":{}}')
    writeFileSync(join(pasta, 'src/features/items/base.ts'), 'export const base = 1\n')
    writeFileSync(join(pasta, 'src/features/models/a.module.css'), '')
    // Permitido: models depende de items, e uma feature importa a si mesma.
    writeFileSync(join(pasta, 'src/features/models/ok.ts'), "import { base } from '../items/base'\nimport './a.module.css'\nexport const ok = base\n")
    // Proibidos: items importando models (sentido inverso), settings importando o CSS de models, dashboard importando app.
    writeFileSync(join(pasta, 'src/features/items/volta.ts'), "import { ok } from '../models/ok'\nexport const volta = ok\n")
    writeFileSync(join(pasta, 'src/features/settings/page.ts'), "import '../models/a.module.css'\nexport const page = 1\n")
    writeFileSync(join(pasta, 'src/features/dashboard/page.ts'), "export { navigationItems } from '../../app/navigation'\n")
    const resultado = spawnSync(process.execPath, [resolve('scripts/check-project.mjs')], { cwd: pasta, encoding: 'utf8' })
    expect(resultado.status).toBe(1)
    expect(resultado.stderr).toContain('src/features/items/volta.ts: feature items importa a feature models')
    expect(resultado.stderr).toContain('src/features/settings/page.ts: feature settings importa a feature models')
    expect(resultado.stderr).toContain('src/features/dashboard/page.ts: feature importa app ou routes')
    expect(resultado.stderr).not.toContain('src/features/models/ok.ts')
  } finally {
    if (pasta.startsWith(join(tmpdir(), 'zera-check-'))) rmSync(pasta, { recursive: true, force: true })
  }
})
