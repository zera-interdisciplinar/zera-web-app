import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import NotFoundPage from '../src/pages/NotFoundPage'
import { estadoInicialTriagem, triagemReducer } from '../src/reducers/triagemReducer'
import { sanitizarObjeto } from '../src/utils/sanitizacao'
import { carregar, salvar, VERSAO_SCHEMA } from '../src/utils/storage'

function arquivos(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap(entrada => entrada.isDirectory() ? arquivos(`${pasta}/${entrada.name}`) : [`${pasta}/${entrada.name}`])
}
const ler = (arquivo: string) => readFileSync(arquivo, 'utf8')

afterEach(() => vi.unstubAllGlobals())

it('Req 1: estrutura Vite, React e TypeScript e extensões de src', () => {
  const pacote = JSON.parse(ler('package.json'))
  expect(pacote.dependencies.react).toBeTruthy()
  expect(pacote.devDependencies.vite).toBeTruthy()
  expect(pacote.devDependencies['@vitejs/plugin-react']).toBeTruthy()
  for (const caminho of ['index.html', 'tsconfig.app.json', 'tsconfig.node.json', 'src/main.tsx']) expect(existsSync(caminho)).toBe(true)
  expect(arquivos('src').filter(arquivo => !/\.tsx?$/.test(arquivo))).toEqual([])
})

it('Req 2: componentes e páginas usam index.tsx', () => {
  for (const arquivo of [...arquivos('src/components'), ...arquivos('src/pages')].filter(a => a.endsWith('.tsx'))) {
    expect(arquivo).toMatch(/\/index\.tsx$/)
  }
})

it('Req 3: seis componentes não acessam serviços nem fetch', () => {
  for (const nome of ['Button', 'DataTable', 'Modal', 'Skeleton', 'BarChart', 'PesoMensal']) {
    const texto = ler(`src/components/${nome}/index.tsx`)
    expect(texto).not.toMatch(/\bfetch\s*\(|from\s+['"][^'"]*\/services\//)
  }
})

it('Req 6: reducer atualiza o checklist sem alterar o estado anterior', () => {
  const inicial = { ...estadoInicialTriagem, checklist: Object.freeze({}) }
  Object.freeze(inicial)
  const resultado = triagemReducer(inicial, { tipo: 'alternar-checklist', item: 'teste' })
  expect(inicial.checklist).toEqual({})
  expect(resultado.checklist).toEqual({ teste: true })
  expect(resultado).not.toBe(inicial)
})

it('Req 7: exhaustive-deps está configurado como erro', () => {
  expect(ler('eslint.config.js')).toMatch(/['"]react-hooks\/exhaustive-deps['"]\s*:\s*['"]error['"]/)
})

it('Req 10: rota curinga renderiza página com botão de retorno', () => {
  expect(ler('src/routes/AppRoutes.tsx')).toMatch(/path="\*"\s+element=\{<NotFoundPage\s*\/>\}/)
  const html = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(NotFoundPage)))
  expect(html).toContain('Página não encontrada')
  expect(html).toMatch(/<button[^>]*>Voltar ao início<\/button>/)
})

it('Req 16: reducer declara estado e ação como uniões discriminadas', () => {
  const texto = ler('src/reducers/triagemReducer.ts')
  expect(texto).toMatch(/type EstadoTriagem\s*=\s*DadosTriagem\s*&\s*\(/)
  expect(texto).toMatch(/type AcaoTriagem\s*=[\s\S]*?\|\s*\{\s*tipo:/)
  expect(texto).toContain('function triagemReducer(estado: EstadoTriagem, acao: AcaoTriagem)')
})

it('Req 19: migra versão antiga e rejeita dados corrompidos', () => {
  const valores = new Map<string, string>()
  vi.stubGlobal('window', { localStorage: { getItem: (chave: string) => valores.get(chave) ?? null, setItem: (chave: string, valor: string) => valores.set(chave, valor), removeItem: (chave: string) => valores.delete(chave) } })
  valores.set('preferencia', JSON.stringify({ _versao: 1, dados: { antigo: true } }))
  expect(carregar('preferencia', { 1: () => ({ novo: true }) })).toEqual({ novo: true })
  expect(JSON.parse(valores.get('preferencia') ?? '{}')._versao).toBe(VERSAO_SCHEMA)
  valores.set('corrompido', '{')
  expect(carregar('corrompido')).toBeNull()
  salvar('novo', { valor: 1 })
  expect(JSON.parse(valores.get('novo') ?? '{}')._versao).toBe(VERSAO_SCHEMA)
})

it('Req 21: sanitização recursiva remove tags e protocolos perigosos', () => {
  expect(sanitizarObjeto({ texto: '<b>Olá</b>', itens: ['javascript:alert(1)', 'normal'] })).toEqual({ texto: 'Olá', itens: ['alert(1)', 'normal'] })
})

function checagemEstatica(): void {
  const resultado = spawnSync(process.execPath, ['scripts/check-project.mjs'], { encoding: 'utf8' })
  expect(resultado.stderr).toBe('')
  expect(resultado.status).toBe(0)
}

it('Req 4: tipos de domínio existem e a análise estática proíbe any e ts-ignore', () => {
  expect(arquivos('src/types').filter(a => a.endsWith('.ts')).length).toBeGreaterThan(1)
  checagemEstatica()
})

it('Req 5: serviços assíncronos exportados declaram Promise e tratam exceções', () => {
  checagemEstatica()
  const falhas: string[] = []
  for (const caminho of arquivos('src/services').filter(a => a.endsWith('.ts'))) {
    const fonte = ts.createSourceFile(caminho, ler(caminho), ts.ScriptTarget.Latest, true)
    for (const no of fonte.statements) {
      if (!ts.isFunctionDeclaration(no) || !no.modifiers?.some(x => x.kind === ts.SyntaxKind.ExportKeyword) || !no.modifiers.some(x => x.kind === ts.SyntaxKind.AsyncKeyword)) continue
      let trata = false
      function visitar(n: ts.Node) { if (ts.isTryStatement(n)) trata = true; ts.forEachChild(n, visitar) }
      if (no.body) visitar(no.body)
      if (!trata || !no.type?.getText(fonte).startsWith('Promise<')) falhas.push(`${caminho}:${no.name?.text}`)
    }
  }
  expect(falhas).toEqual([])
  expect(spawnSync('git', ['ls-files', '.env', '.env.local'], { encoding: 'utf8' }).stdout.trim()).toBe('')
})

it('Req 8: análise estática rejeita key baseada em índice', () => { checagemEstatica() })
it('Req 9: análise estática procura guardas dos parâmetros de rota', () => { checagemEstatica() })

it('Req 11: imagens têm alt e há foco visível nas folhas de estilo', () => {
  checagemEstatica()
  expect(arquivos('styles').filter(a => a.endsWith('.css')).some(a => ler(a).includes(':focus-visible'))).toBe(true)
})

it('Req 12: estados da requisição distinguem carregamento, dados e erro', () => {
  const hook = ler('src/hooks/useRequisicao.ts')
  expect(hook).toContain('carregando')
  expect(hook).toContain('dados:')
  expect(hook).toContain('erro:')
  expect(ler('src/components/EstadoErro/index.tsx')).toContain('role="alert"')
  checagemEstatica()
})

it('Req 13: README contém os dois links e as publicações respondem HTTP 200', async () => {
  const readme = ler('README.md')
  const urls = ['https://zera-web-app-kappa.vercel.app', 'https://zera-interdisciplinar.github.io/zera-web-app/']
  for (const url of urls) expect(readme).toContain(url)
  const respostas = await Promise.all(urls.map(url => fetch(url, { signal: AbortSignal.timeout(15_000) })))
  expect(respostas.map(resposta => resposta.status)).toEqual([200, 200])
}, 20_000)

it('Req 14: histórico disponível tem ao menos vinte commits convencionais', () => {
  const git = spawnSync('git', ['log', '--format=%s'], { encoding: 'utf8' })
  expect(git.status).toBe(0)
  expect(git.stdout.split('\n').filter(linha => /^(feat|fix|refactor|docs|test|ci|chore|style|perf|build)(\([^)]*\))?!?:\s/.test(linha)).length).toBeGreaterThanOrEqual(20)
})

it('Req 15: Provider e hook tipado usam o mesmo Context', () => {
  expect(ler('src/context/AuthContext.tsx')).toContain('<AuthContext.Provider')
  expect(ler('src/hooks/useAuth.ts')).toContain('useContext(AuthContext)')
  expect(ler('src/hooks/useAuth.ts')).toContain('useAuth(): ValorAuth')
})

it('Req 17: hook de requisição tipado cancela consulta e expõe estados', () => {
  const hook = ler('src/hooks/useRequisicao.ts')
  expect(hook).toContain('EstadoRequisicao<T>')
  expect(hook).toContain('new AbortController()')
  expect(hook).toContain('controlador.abort()')
  const tipo = ler('src/types/controles/EstadoLocalRequisicao.ts')
  expect(tipo).toContain('carregando: boolean')
  expect(tipo).toContain('erro: string | null')
})

it('Req 18: páginas são importadas por lazy e envolvidas em Suspense', () => {
  const rotas = ler('src/routes/AppRoutes.tsx')
  for (const arquivo of arquivos('src/pages').filter(a => a.endsWith('/index.tsx'))) {
    const nome = arquivo.split('/')[2]
    expect(rotas).toContain(`lazy(() => import('../pages/${nome}'))`)
  }
  expect(rotas).toContain('<Suspense ')
})

it('Req 20: análise exige justificativa para useCallback e useMemo', () => { checagemEstatica() })

it('Req 22: cadastro de item valida antes de chamar a API', () => {
  const servico = ler('src/services/itemCadastroService.ts')
  expect(servico.indexOf('validarCadastroItemReal(entrada)')).toBeGreaterThan(0)
  expect(servico.indexOf('validarCadastroItemReal(entrada)')).toBeLessThan(servico.indexOf("requisitarApiReal<unknown>('inventory'"))
})

it('Req 23: rota privada consome autenticação e redireciona ao login', () => {
  const rota = ler('src/components/PrivateRoute/index.tsx')
  expect(rota).toContain('useAuth()')
  expect(rota).toContain('if (!autenticado)')
  expect(rota).toContain('<Navigate to="/login"')
})

it('Req 24: abas e menus expõem seus estados ARIA', () => {
  const abas = ler('src/components/PainelGestao/index.tsx')
  expect(abas).toContain('aria-selected=')
  expect(abas).toContain('aria-controls=')
  const menu = ler('src/components/FilterChip/index.tsx')
  expect(menu).toContain('aria-haspopup="menu"')
  expect(menu).toContain('aria-expanded=')
})
