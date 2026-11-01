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
}, 20_000)

it('só aceita .ts e .tsx dentro de src (estilos e imagens ficam fora)', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'zera-check-'))
  try {
    for (const dir of ['src/components/Botao', 'src/pages', 'styles', 'tests/fixtures']) mkdirSync(join(pasta, dir), { recursive: true })
    writeFileSync(join(pasta, 'styles/tokens.css'), '')
    writeFileSync(join(pasta, 'tests/fixtures/design-tokens.json'), '{"color":{}}')
    writeFileSync(join(pasta, 'src/components/Botao/Botao.module.css'), '.a { color: red }')
    writeFileSync(join(pasta, 'src/components/Botao/logo.png'), '')
    const resultado = spawnSync(process.execPath, [resolve('scripts/check-project.mjs')], { cwd: pasta, encoding: 'utf8' })
    expect(resultado.status).toBe(1)
    expect(resultado.stderr).toContain('src/components/Botao/Botao.module.css: extensão fora do padrão')
    expect(resultado.stderr).toContain('src/components/Botao/logo.png: extensão fora do padrão')
  } finally {
    if (pasta.startsWith(join(tmpdir(), 'zera-check-'))) rmSync(pasta, { recursive: true, force: true })
  }
}, 20_000)

it('impede que uma camada importe a que está acima dela e que telas acessem services', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'zera-check-'))
  try {
    for (const dir of ['src/components/Botao', 'src/pages/Tela', 'src/services', 'src/utils', 'src/hooks', 'src/reducers', 'styles', 'tests/fixtures']) mkdirSync(join(pasta, dir), { recursive: true })
    writeFileSync(join(pasta, 'styles/tokens.css'), '')
    writeFileSync(join(pasta, 'tests/fixtures/design-tokens.json'), '{"color":{}}')
    writeFileSync(join(pasta, 'src/services/itens.ts'), "export const listar = () => fetch('/x')\n")
    writeFileSync(join(pasta, 'src/hooks/useItens.ts'), "import { listar } from '../services/itens'\nexport const useItens = () => listar\n")
    // Permitido: tela -> hook -> service; fetch dentro de src/services.
    writeFileSync(join(pasta, 'src/pages/Tela/index.tsx'), "import { useItens } from '../../hooks/useItens'\nexport default function Tela() { return <p>{String(useItens)}</p> }\n")
    // Proibidos: componente chamando service, service importando hook, util importando service, fetch fora de services, msw em src.
    writeFileSync(join(pasta, 'src/components/Botao/index.tsx'), "import { listar } from '../../services/itens'\nexport function Botao() { api.mutate({}); schema.safeParse({}); return <button type=\"button\">{String(listar)}</button> }\n")
    writeFileSync(join(pasta, 'src/services/ruim.ts'), "import { useItens } from '../hooks/useItens'\nexport const x = useItens\n")
    writeFileSync(join(pasta, 'src/utils/formatar.ts'), "import { listar } from '../services/itens'\nimport { http } from 'msw'\nexport const f = () => fetch('/y')\nexport const g = listar\n")
    writeFileSync(join(pasta, 'src/reducers/r.ts'), "import { useItens } from '../hooks/useItens'\nexport const r = useItens\n")
    const resultado = spawnSync(process.execPath, [resolve('scripts/check-project.mjs')], { cwd: pasta, encoding: 'utf8' })
    expect(resultado.status).toBe(1)
    expect(resultado.stderr).toContain('src/components/Botao/index.tsx: vista acessa serviço')
    expect(resultado.stderr).toContain('mova validação e orquestração de mutações para hooks/utils')
    expect(resultado.stderr).toContain('src/components/Botao/index.tsx: components não pode importar services')
    expect(resultado.stderr).toContain('src/services/ruim.ts: services não pode importar hooks')
    expect(resultado.stderr).toContain('src/utils/formatar.ts: utils não pode importar services')
    expect(resultado.stderr).toContain('src/reducers/r.ts: reducers não pode importar hooks')
    expect(resultado.stderr).toContain('src/utils/formatar.ts: msw só é permitido em tests/')
    expect(resultado.stderr).toContain('src/utils/formatar.ts: fetch fora de services')
    expect(resultado.stderr).not.toContain('src/pages/Tela')
    expect(resultado.stderr).not.toContain('src/hooks/useItens.ts')
    expect(resultado.stderr).not.toContain('src/services/itens.ts')
  } finally {
    if (pasta.startsWith(join(tmpdir(), 'zera-check-'))) rmSync(pasta, { recursive: true, force: true })
  }
}, 20_000)
