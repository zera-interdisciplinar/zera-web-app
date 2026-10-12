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
