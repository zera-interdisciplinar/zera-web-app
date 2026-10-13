import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'

const baseUrl = 'http://localhost:8000/api'
const server = setupServer()
const env = import.meta.env as unknown as Record<string, string | undefined>
let demoCredentials: Array<{ email: string; senha: string }>

function credenciaisDemoConfiguradas() {
  return [1, 2, 3].map((indice) => {
    const prefixo = `VITE_DEMO_USER_${indice}`
    const email = env[`${prefixo}_EMAIL`] ?? ''
    const senha = env[`${prefixo}_PASSWORD`] ?? ''
    if (!email || !senha || senha === 'PREENCHER_NO_VSCODE') {
      throw new Error('Preencha as senhas de demonstração no .env')
    }
    return { email, senha }
  })
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  vi.stubEnv('VITE_USE_MSW', 'true')
  vi.stubEnv('VITE_API_BASE_URL', baseUrl)
  vi.stubEnv('VITE_ADMIN_API_URL', '')
  vi.resetModules()
  const { handlers } = await import('../src/mocks/handlers')
  server.use(...handlers)
})
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})
afterAll(() => server.close())

describe('login', () => {
  it('remove os links e botões de demonstração da LoginPage', () => {
    const fonte = readFileSync(new URL('../src/pages/LoginPage/index.tsx', import.meta.url), 'utf8')
    for (const texto of [
      'Não tenho cadastro',
      'Pré-visualização local',
      'Abrir como gestor',
      'Abrir como funcionário',
      'Solicitar%20acesso%20ao%20Zera',
      'mailto:',
      'tel:',
      'instagram.com',
      'Esqueci minha senha',
      'Voltar',
    ]) {
      expect(fonte).not.toContain(texto)
    }
  })

  it('preserva a senha exatamente como digitada, inclusive espaços nas pontas', async () => {
    const senha = ' PREENCHER_NO_VSCODE '
    const { validarCredenciais } = await import('../src/utils/validacao')
    const resultado = validarCredenciais({ email: 'teste@zera.com', senha })

    expect(resultado.valido).toBe(true)
    expect(resultado.dados.senha).toBe(senha)
  })

  it('autentica somente os três usuários configurados e marca as sessões como demonstração', async () => {
    demoCredentials = credenciaisDemoConfiguradas()
    const { autenticar } = await import('../src/services/authService')
    const sessoes = await Promise.all(demoCredentials.map(({ email, senha }) => autenticar({ email, senha })))

    expect(sessoes.map((sessao) => sessao.usuario.perfil)).toEqual([
      'funcionario',
      'gestor',
      'gestor',
    ])
    for (const sessao of sessoes) {
      expect(sessao.demonstracao).toBe(true)
      expect(Date.parse(sessao.expiraEm)).toBeGreaterThan(Date.now())
      expect(sessao.usuario).toBeDefined()
      expect(JSON.stringify(sessao)).not.toContain(demoCredentials.find((usuario) => usuario.email === sessao.usuario.email)?.senha)
    }
  })

  it('recusa senha errada, e-mail inexistente e outro domínio com a mesma mensagem', async () => {
    const senhaConfigurada = randomUUID()
    vi.stubEnv('VITE_DEMO_USER_1_EMAIL', 'login-teste@zera.com')
    vi.stubEnv('VITE_DEMO_USER_1_PASSWORD', senhaConfigurada)
    vi.stubEnv('VITE_DEMO_USER_1_ROLE', 'EMPLOYEE')
    vi.stubEnv('VITE_DEMO_USER_1_NAME', 'Teste')
    vi.resetModules()
    const { handlers } = await import('../src/mocks/handlers')
    server.resetHandlers()
    server.use(...handlers)
    const { autenticar, mensagemErroLogin } = await import('../src/services/authService')
    const senhaTentada = randomUUID()
    const tentativas = await Promise.all([
      autenticar({ email: 'login-teste@zera.com', senha: senhaTentada }),
      autenticar({ email: 'nao-cadastrado@zera.com', senha: senhaTentada }),
      autenticar({ email: 'usuario@example.com', senha: senhaTentada }),
    ].map((promessa) => promessa.catch((erro: unknown) => erro)))

    expect(tentativas.map(mensagemErroLogin)).toEqual([
      'E-mail ou senha inválidos.',
      'E-mail ou senha inválidos.',
      'E-mail ou senha inválidos.',
    ])
  })

  it('recusa perfil vazio ou desconhecido e registra apenas a chave de configuração', async () => {
    demoCredentials = credenciaisDemoConfiguradas()
    vi.stubEnv('VITE_DEMO_USER_1_ROLE', 'UNKNOWN_ROLE')
    vi.resetModules()
    const { handlers } = await import('../src/mocks/handlers')
    server.resetHandlers()
    server.use(...handlers)
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { autenticar, mensagemErroLogin } = await import('../src/services/authService')

    const falha = await autenticar({ ...demoCredentials[0] }).catch((erro: unknown) => erro)
    expect(mensagemErroLogin(falha)).toBe('Perfil de demonstração inválido.')
    expect(aviso).toHaveBeenCalledWith('VITE_DEMO_USER_1_ROLE')
    expect(JSON.stringify(aviso.mock.calls)).not.toContain('UNKNOWN_ROLE')
  })

  it('não registra o handler de demonstração com VITE_USE_MSW=false', async () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    vi.resetModules()
    const { handlers } = await import('../src/mocks/handlers')
    server.resetHandlers()
    server.use(...handlers)

    await expect(fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })).rejects.toThrow()
  })

  it.each([401, 403])('mapeia HTTP %s para credenciais inválidas', async (status) => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })))
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.resetModules()
    const { autenticar, mensagemErroLogin } = await import('../src/services/authService')

    const falha = await autenticar({ email: 'teste@example.invalid', senha: '' }).catch((erro: unknown) => erro)
    expect(falha).toMatchObject({ status })
    expect(mensagemErroLogin(falha)).toBe('E-mail ou senha inválidos.')
    expect(aviso).toHaveBeenCalledWith('[login] Falha na autenticação', {
      url: 'http://localhost:8000/api/v1/auth/login',
      tipo: 'http',
    })
    expect((aviso.mock.calls[0][1] as { url: string }).url.match(/\/api/g)).toHaveLength(1)
  })

  it('mapeia fetch sem resposta como servidor indisponível e não registra credenciais', async () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.resetModules()
    const { autenticar, mensagemErroLogin } = await import('../src/services/authService')

    const falha = await autenticar({ email: 'teste@example.invalid', senha: '' }).catch((erro: unknown) => erro)
    expect(mensagemErroLogin(falha)).toBe('Servidor de autenticação indisponível. Tente novamente mais tarde.')
    expect(aviso).toHaveBeenCalledTimes(1)
    expect(aviso.mock.calls[0]).toEqual(['[login] Falha na autenticação', {
      url: 'http://localhost:8000/api/v1/auth/login',
      tipo: 'rede',
    }])
  })

  it('mostra o código de outros status HTTP sem expor corpo da resposta', async () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('detalhe interno', { status: 503 })))
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.resetModules()
    const { autenticar, mensagemErroLogin } = await import('../src/services/authService')

    const falha = await autenticar({ email: 'teste@example.invalid', senha: '' }).catch((erro: unknown) => erro)
    expect(mensagemErroLogin(falha)).toBe('Erro ao entrar (código 503).')
    expect(mensagemErroLogin(falha)).not.toContain('detalhe interno')
  })
})
