import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import NotFoundPage from '../src/pages/NotFoundPage'
import { initialRequest, requestReducer } from '../src/reducers/requestReducer'
import { initialOverviewState, overviewReducer } from '../src/reducers/overviewReducer'
import { sanitizarObjeto } from '../src/utils/sanitizacao'
import { loadStored, saveStored } from '../src/utils/storage'
import { validate } from '../src/utils/validation'
import { createItemSchema } from '../src/utils/itemValidation'

/**
 * Checks, one by one, what the "Desenvolvimento de Aplicações Dinâmicas" sheet (Projeto Interdisciplinar, 14/05/2026)
 * asks for. The numbers follow the order of the sheet: Req 1-14 are the minimum for a 7.0, Req 15-24 the extras.
 */
function arquivos(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap(entrada => entrada.isDirectory() ? arquivos(`${pasta}/${entrada.name}`) : [`${pasta}/${entrada.name}`])
}
const ler = (arquivo: string) => readFileSync(arquivo, 'utf8')

afterEach(() => vi.unstubAllGlobals())

function checagemEstatica(): void {
  expect(resultadoChecagemEstatica.stderr).toBe('')
  expect(resultadoChecagemEstatica.status).toBe(0)
}
const resultadoChecagemEstatica = spawnSync(process.execPath, ['scripts/check-project.mjs'], { encoding: 'utf8' })

// ---------------------------------------------------------------------------------------------- mínimo para o 7,0

it('Req 1: Vite + React + TypeScript; dentro de src/ só .ts e .tsx (nada de .js, .jsx, .css ou imagens)', () => {
  const pacote = JSON.parse(ler('package.json'))
  expect(pacote.dependencies.react).toBeTruthy()
  expect(pacote.devDependencies.vite).toBeTruthy()
  expect(pacote.devDependencies['@vitejs/plugin-react']).toBeTruthy()
  for (const caminho of ['index.html', 'tsconfig.app.json', 'tsconfig.node.json', 'src/main.tsx']) expect(existsSync(caminho)).toBe(true)
  expect(arquivos('src').filter(arquivo => !/\.tsx?$/.test(arquivo))).toEqual([])
})

it('Req 2: componentes e páginas, cada um em pasta própria com index.tsx, em todo o projeto', () => {
  const tsx = arquivos('src').filter(arquivo => arquivo.endsWith('.tsx'))
  // Fora do ponto de entrada, do roteador e dos Providers, todo .tsx é um componente ou uma página.
  const permitidos = /^src\/(?:App|main)\.tsx$|^src\/(?:context|routes)\/[^/]+\.tsx$|^src\/(?:components|pages)\/[^/]+\/index\.tsx$/
  expect(tsx.filter(arquivo => !permitidos.test(arquivo))).toEqual([])
  expect(arquivos('src/pages').filter(arquivo => arquivo.endsWith('.tsx')).length).toBeGreaterThanOrEqual(3)
  // Um componente por pasta: o nome da pasta é o nome do componente exportado.
  for (const arquivo of tsx.filter(a => /^src\/(?:components|pages)\//.test(a))) {
    const nome = arquivo.split('/')[2]
    const texto = ler(arquivo)
    expect(texto, arquivo).toMatch(new RegExp(`(?:function|class) ${nome}\\b`))
  }
})

it('Req 3: seis componentes de apresentação, sem serviços, fetch ou lógica assíncrona; nenhuma tela acessa src/services', () => {
  for (const nome of ['Button', 'DataTable', 'EmptyState', 'EstadoErro', 'PageHeader', 'Skeleton']) {
    const texto = ler(`src/components/${nome}/index.tsx`)
    expect(texto).not.toMatch(/\bfetch\s*\(|from\s+['"][^'"]*\/services\//)
    expect(texto).not.toMatch(/\buse(?:State|Effect|Reducer)\s*\(/)
  }
  for (const arquivo of arquivos('src/components').concat(arquivos('src/pages')).filter(a => a.endsWith('.tsx'))) {
    expect(ler(arquivo), arquivo).not.toMatch(/from\s+['"][^'"]*\/services\//)
  }
  checagemEstatica()
})

it('Req 4: interfaces de props e entidades de domínio em src/types, organizadas por arquivo; sem any', () => {
  for (const dominio of ['item', 'model', 'auth', 'dashboard', 'settings', 'http']) expect(existsSync(`src/types/${dominio}.ts`), dominio).toBe(true)
  const props = arquivos('src/types/componentes').filter(a => a.endsWith('.ts'))
  expect(props.length).toBeGreaterThanOrEqual(30)
  // Toda tela e todo componente tipa os parâmetros com um tipo importado de src/types (verificado pelo check-project).
  checagemEstatica()
}, 15_000)

it('Req 5: toda comunicação com a API está em src/services, um arquivo por recurso, com Promise<Tipo> e try/catch', () => {
  checagemEstatica()
  const servicos = arquivos('src/services').filter(a => a.endsWith('.ts'))
  for (const recurso of ['auth', 'items', 'models', 'categories', 'materials', 'settings', 'dashboard']) expect(servicos, recurso).toContain(`src/services/${recurso}.ts`)
  const falhas: string[] = []
  let total = 0
  for (const caminho of servicos) {
    const fonte = ts.createSourceFile(caminho, ler(caminho), ts.ScriptTarget.Latest, true)
    for (const no of fonte.statements) {
      if (!ts.isFunctionDeclaration(no) || !no.modifiers?.some(x => x.kind === ts.SyntaxKind.ExportKeyword) || !no.modifiers.some(x => x.kind === ts.SyntaxKind.AsyncKeyword)) continue
      total += 1
      let trata = false
      function visitar(n: ts.Node) { if (ts.isTryStatement(n)) trata = true; ts.forEachChild(n, visitar) }
      if (no.body) visitar(no.body)
      if (!trata || !no.type?.getText(fonte).startsWith('Promise<')) falhas.push(`${caminho}:${no.name?.text}`)
    }
  }
  expect(total).toBeGreaterThan(20)
  expect(falhas).toEqual([])
  // fetch só dentro de src/services; chaves e URLs privadas ficam fora do repositório.
  const comFetch = arquivos('src').filter(a => /\.tsx?$/.test(a) && /(?<![.\w])fetch\s*\(/.test(ler(a)))
  expect(comFetch.filter(a => !a.startsWith('src/services/'))).toEqual([])
  expect(spawnSync('git', ['ls-files', '.env', '.env.local'], { encoding: 'utf8' }).stdout.trim()).toBe('')
  const arquivosRastreados = spawnSync('git', ['ls-files'], { encoding: 'utf8' }).stdout.split(/\r?\n/)
  expect(arquivosRastreados.filter(arquivo => /^\.env(?:\.|$)/.test(arquivo) && arquivo !== '.env.example')).toEqual([])
  expect(ler('.env.example')).not.toMatch(/^VITE_[A-Z0-9_]*(?:PASSWORD|TOKEN|SECRET|PRIVATE|APP_API_KEY)\s*=/im)
})

it('Req 6: estado local agrupado e sem mutação direta (useState em objeto, useReducer puro)', () => {
  // Um reducer devolve um objeto novo e não toca no anterior (o estado congelado acusaria a mutação).
  const inicial = Object.freeze({ ...initialOverviewState })
  const depois = overviewReducer(inicial, { type: 'connection', state: 'open' })
  expect(depois).not.toBe(inicial)
  expect(inicial).toEqual(initialOverviewState)
  const congelado = Object.freeze({ status: 'success', data: [1] } as const)
  expect(requestReducer(congelado, { type: 'failure', message: 'x' })).toEqual({ status: 'error', message: 'x' })
  const fontesDeEstado = [...arquivos('src/hooks'), ...arquivos('src/reducers')].filter(arquivo => /\.tsx?$/.test(arquivo))
  expect(fontesDeEstado.filter(arquivo => /\.(?:push|splice|sort)\s*\(/.test(ler(arquivo)))).toEqual([])
  checagemEstatica() // um useState por função: o estado relacionado vai junto em um objeto
})

it('Req 7: exhaustive-deps está configurado como erro', () => {
  expect(ler('eslint.config.js')).toMatch(/['"]react-hooks\/exhaustive-deps['"]\s*:\s*['"]error['"]/)
})

it('Req 8: análise estática rejeita key baseada em índice', () => { checagemEstatica() })
it('Req 9: análise estática procura guardas dos parâmetros de rota', () => { checagemEstatica() })

it('Req 10: três rotas ou mais, Link/useNavigate e rota curinga com página de erro e botão de retorno', () => {
  const rotas = ler('src/routes/AppRoutes.tsx')
  expect((rotas.match(/<Route\b/g) ?? []).length).toBeGreaterThanOrEqual(3)
  expect(rotas).toMatch(/path="\*"\s+element=\{<NotFoundPage\s*\/>\}/)
  expect(arquivos('src').some(arquivo => /\.tsx?$/.test(arquivo) && /\b(?:Link|useNavigate)\b/.test(ler(arquivo)))).toBe(true)
  expect(ler('scripts/check-project.mjs')).toContain('window.location')
  const html = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(NotFoundPage)))
  expect(html).toContain('Página não encontrada')
  expect(html).toMatch(/<button[^>]*>Voltar ao início<\/button>/)
})

it('Req 11: acessibilidade mínima (button, label htmlFor, alt, role="alert", foco visível, teclado)', () => {
  checagemEstatica()
  expect(arquivos('styles').filter(a => a.endsWith('.css')).some(a => ler(a).includes(':focus-visible'))).toBe(true)
  expect(ler('scripts/check-project.mjs')).toContain('ação em div; use button')
  expect(ler('e2e/login.playwright.ts')).toContain("page.keyboard.press('Tab')")
  expect(ler('e2e/rotas.playwright.ts')).toContain('AxeBuilder')
  // Nenhum <label> sem htmlFor, nenhum alert()/confirm() nativo.
  const telas = arquivos('src').filter(a => a.endsWith('.tsx'))
  expect(telas.filter(a => /<label(?![^>]*htmlFor)/.test(ler(a)))).toEqual([])
  expect(arquivos('src').filter(a => /\.tsx?$/.test(a) && /\b(?:alert|confirm)\s*\(/.test(ler(a)))).toEqual([])
  expect(ler('src/components/EstadoErro/index.tsx')).toContain('role="alert"')
})

it('Req 12: feedback assíncrono com carregando, sucesso e erro no DOM', () => {
  const hook = ler('src/hooks/useRequest.ts')
  for (const trecho of ['loading', 'data:', 'error:']) expect(hook).toContain(trecho)
  expect(ler('src/components/EstadoErro/index.tsx')).toContain('role="alert"')
  expect(ler('src/components/Skeleton/index.tsx')).toContain('role="status"')
  expect(ler('src/components/Toast/index.tsx')).toContain('role="status"')
  checagemEstatica()
})

it('Req 13: README contém o link da publicação e ela responde HTTP 200', async () => {
  const readme = ler('README.md')
  const urls = ['https://zera-interdisciplinar.github.io/zera-web-app/']
  for (const url of urls) expect(readme).toContain(url)
  const respostas = await Promise.all(urls.map(url => fetch(url, { signal: AbortSignal.timeout(15_000) })))
  expect(respostas.map(resposta => resposta.status)).toEqual([200])
}, 20_000)

it('Req 14: histórico disponível tem ao menos vinte commits convencionais', () => {
  const git = spawnSync('git', ['log', '--format=%s'], { encoding: 'utf8' })
  expect(git.status).toBe(0)
  expect(git.stdout.split('\n').filter(linha => /^(feat|fix|refactor|docs|test|ci|chore|style|perf|build)(\([^)]*\))?!?:\s/.test(linha)).length).toBeGreaterThanOrEqual(20)
})

// ------------------------------------------------------------------------------------------------------ extras

it('Req 15: Context API com Provider dedicado, hook de consumo e tipagem completa', () => {
  expect(ler('src/context/AuthContext.tsx')).toContain('<AuthContext.Provider')
  expect(ler('src/hooks/useAuth.ts')).toContain('useContext(AuthContext)')
  expect(ler('src/hooks/useAuth.ts')).toContain('useAuth(): ValorAuth')
  expect(ler('src/context/AccessibilityContext.tsx')).toContain('<AccessibilityContext.Provider')
})

it('Req 16: useReducer com State e Action tipados em uniões discriminadas', () => {
  const dashboard = ler('src/types/dashboard.ts')
  expect(dashboard).toMatch(/type OverviewAction\s*=[\s\S]*?\|\s*\{\s*type:/)
  expect(dashboard).toMatch(/OverviewState/)
  expect(ler('src/types/request.ts')).toMatch(/type RequestAction<T>\s*=[\s\S]*?\|\s*\{\s*type:/)
  expect(ler('src/reducers/overviewReducer.ts')).toContain('function overviewReducer(state: OverviewState, action: OverviewAction)')
  expect(ler('src/hooks/useOverviewStream.ts')).toContain('useReducer(overviewReducer')
  expect(ler('src/hooks/useRequest.ts')).toContain('useReducer(')
})

it('Req 17: hook de requisição tipado, com loading, erro tratado e cancelamento via AbortController', () => {
  const hook = ler('src/hooks/useRequest.ts')
  expect(hook).toContain('RequestState<T>')
  expect(hook).toContain('new AbortController()')
  expect(hook).toContain('controller.abort()')
  expect(hook).toContain('controller.signal.aborted')
  const tipo = ler('src/types/request.ts')
  expect(tipo).toContain('loading: boolean')
  expect(tipo).toContain('error: string | null')
  // E ele está em uso de verdade, não só definido.
  expect(arquivos('src/hooks').filter(a => a !== 'src/hooks/useRequest.ts' && ler(a).includes('useRequest('))).not.toEqual([])
  expect(requestReducer(initialRequest, { type: 'success', data: 7 })).toEqual({ status: 'success', data: 7 })
})

it('Req 18: páginas são importadas por lazy e envolvidas em Suspense', () => {
  const rotas = ler('src/routes/AppRoutes.tsx')
  for (const arquivo of arquivos('src/pages').filter(a => a.endsWith('/index.tsx'))) {
    const nome = arquivo.split('/')[2]
    expect(rotas).toContain(`lazy(() => import('../pages/${nome}'))`)
  }
  expect(rotas).toContain('<Suspense ')
  expect(ler('e2e/chunks.playwright.ts')).toContain('novos.length')
})

it('Req 19: localStorage com schema versionado (_versao), migração e descarte seguro', () => {
  const valores = new Map<string, string>()
  vi.stubGlobal('window', { localStorage: { getItem: (chave: string) => valores.get(chave) ?? null, setItem: (chave: string, valor: string) => valores.set(chave, valor), removeItem: (chave: string) => valores.delete(chave) } })
  valores.set('preferencia', JSON.stringify({ _versao: 1, data: { antigo: true } }))
  expect(loadStored('preferencia', { version: 2, migrations: { 1: () => ({ novo: true }) } })).toEqual({ novo: true })
  expect(JSON.parse(valores.get('preferencia') ?? '{}')._versao).toBe(2)
  valores.set('corrompido', '{')
  expect(loadStored('corrompido', { version: 2 })).toBeNull()
  saveStored('novo', { valor: 1 }, 2)
  expect(JSON.parse(valores.get('novo') ?? '{}')._versao).toBe(2)
  // O único uso real do localStorage (preferências de acessibilidade) passa por esse módulo.
  expect(ler('src/utils/accessibilityPreferences.ts')).toContain('loadStored(')
  expect(arquivos('src').filter(a => /\.tsx?$/.test(a) && a !== 'src/utils/storage.ts' && /\blocalStorage\b/.test(ler(a)))).toEqual([])
})

it('Req 20: análise exige justificativa para useCallback e useMemo', () => { checagemEstatica() })

it('Req 21: proteção contra XSS (sem dangerouslySetInnerHTML; dados externos sanitizados antes de usar)', () => {
  expect(sanitizarObjeto({ texto: '<b>Olá</b>', itens: ['javascript:alert(1)', 'normal'] })).toEqual({ texto: 'Olá', itens: ['alert(1)', 'normal'] })
  expect(arquivos('src').filter(a => /\.tsx?$/.test(a) && ler(a).includes('dangerouslySetInnerHTML'))).toEqual([])
  expect(ler('src/utils/validation.ts')).toContain('sanitizarObjeto(parsed.data)')
  // O endereço da foto vem da API: só http(s) chega ao <img>.
  expect(ler('src/utils/itemSchemas.ts')).toContain('safeImageUrl')
})

it('Req 22: formulários validam dados tipados, em src/utils, antes de enviar aos serviços', () => {
  // Login e recuperação de senha: o esquema valida antes da chamada.
  const login = ler('src/hooks/useLoginForm.ts')
  expect(login).toContain("from '../utils/loginValidation'")
  expect(login.indexOf('loginSchema.safeParse')).toBeGreaterThan(-1)
  expect(login.indexOf('await sessionManager.signIn')).toBeGreaterThan(login.indexOf('loginSchema.safeParse'))
  const recuperacao = ler('src/components/ForgotPasswordDialog/index.tsx')
  expect(recuperacao).toContain("from '../../utils/loginValidation'")
  expect(recuperacao.indexOf('await requestPasswordReset')).toBeGreaterThan(recuperacao.indexOf('forgotPasswordSchema.safeParse'))
  // Os demais formulários passam por `resolverFor(schema)`, que chama `validate`: o envio só acontece com dados válidos.
  const formularios: Array<[string, string, string]> = [
    ['CreateItemDialog', 'createItemSchema', 'mutate(toCreateRequest('],
    ['EditItemDialog', 'editItemSchema', 'mutate({ id: item.id, body }'],
    ['RejectDialog', 'rejectSchema', 'reject.mutate('],
    ['ModelDialog', 'modelFormSchema', 'mutate(toCreateModelRequest('],
    ['CategoryDialog', 'categoryFormSchema', 'create.mutate(values'],
    ['CapacityForm', 'settingsFormSchema', 'save.mutate('],
  ]
  for (const [componente, esquema, envio] of formularios) {
    const fonte = ler(`src/components/${componente}/index.tsx`)
    expect(fonte, componente).toContain(`resolverFor(${esquema})`)
    expect(fonte.indexOf(envio), componente).toBeGreaterThan(fonte.indexOf('handleSubmit('))
  }
  // Tipo, tamanho máximo e mensagem específica por campo.
  for (const arquivo of ['itemValidation', 'modelValidation', 'settingsValidation', 'loginValidation']) {
    const texto = ler(`src/utils/${arquivo}.ts`)
    expect(texto, arquivo).toMatch(/\.max\(/)
    expect(texto, arquivo).toMatch(/Informe|Selecione|Use/)
  }
  const invalido = validate(createItemSchema, { barcode: '', name: 'x'.repeat(200) })
  expect(invalido.ok).toBe(false)
  if (!invalido.ok) expect(invalido.errors.barcode).toBe('Informe o código de barras.')
})

it('Req 23: rota privada consome autenticação por Context e redireciona ao login', () => {
  const rota = ler('src/components/PrivateRoute/index.tsx')
  expect(rota).toContain('useAuth()')
  expect(rota).toContain('if (!autenticado)')
  expect(rota).toContain('<Navigate to="/login"')
  const paginas = arquivos('src/pages').filter(a => a.endsWith('.tsx'))
  expect(paginas.filter(a => /sessionStore|sessionManager|refreshTokenStorage/.test(ler(a)))).toEqual([])
})

it('Req 24: abas, menus e diálogos com padrões ARIA e gerenciamento de foco', () => {
  const abas = ler('src/components/Tabs/index.tsx')
  expect(abas).toContain('aria-selected=')
  expect(abas).toContain('aria-controls=')
  const menu = ler('src/components/UserCard/index.tsx')
  expect(menu).toContain('aria-haspopup="menu"')
  expect(menu).toContain('aria-expanded=')
  // O diálogo nativo prende o foco e o devolve a quem o abriu.
  const dialogo = ler('src/components/Dialog/index.tsx')
  expect(dialogo).toContain('showModal()')
  expect(dialogo).toContain('opener.focus()')
  // Ao abrir, o foco vai para o primeiro campo (ou para a opção segura marcada), não para o botão de fechar.
  expect(dialogo).toContain('data-autofocus')
  expect(ler('src/components/ConfirmDialog/index.tsx')).toContain('data-autofocus')
  expect(dialogo).toContain('aria-labelledby=')
  const leitor = ler('e2e/leitor-virtual.playwright.ts')
  expect(leitor).toContain('@guidepup/virtual-screen-reader')
  expect(leitor).toContain('toMatchAriaSnapshot')
  expect(leitor).toContain('await expect(abrir).toBeFocused()')
  expect(ler('e2e/rotas.playwright.ts')).toContain("getByRole('main')")
  for (const marco of ['<header', '<main', '<nav', '<footer']) expect(arquivos('src').some(a => a.endsWith('.tsx') && ler(a).includes(marco)), marco).toBe(true)
})
