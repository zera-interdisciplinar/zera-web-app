import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = import.meta.env as unknown as Record<string, string | undefined>

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

beforeEach(() => vi.resetModules())

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('autenticação demo por ambiente', () => {
  it('aceita os três usuários configurados e converte ADMIN para gestor', async () => {
    const credenciais = credenciaisDemoConfiguradas()
    const { autenticarUsuarioDemo } = await import('../src/config/demoUsers')
    const resultados = credenciais.map(({ email, senha }) => autenticarUsuarioDemo(email, senha))

    expect(resultados.map((resultado) => resultado.tipo)).toEqual([
      'autenticado',
      'autenticado',
      'autenticado',
    ])
    expect(resultados.map((resultado) => resultado.tipo === 'autenticado' && resultado.usuario.perfil)).toEqual([
      'funcionario',
      'gestor',
      'gestor',
    ])
    expect(JSON.stringify(resultados)).not.toContain(credenciais[0].senha)
  })

  it('recusa domínio externo e usuário não cadastrado', async () => {
    const { autenticarUsuarioDemo } = await import('../src/config/demoUsers')

    expect(autenticarUsuarioDemo('fora@exemplo.invalid', '').tipo).toBe('credenciais-invalidas')
    expect(autenticarUsuarioDemo('nao-cadastrado@zera.com', '').tipo).toBe('credenciais-invalidas')
  })

  it('ignora configuração com campo vazio', async () => {
    const email = env.VITE_DEMO_USER_1_EMAIL ?? ''
    vi.stubEnv('VITE_DEMO_USER_1_NAME', '')
    vi.resetModules()
    const { autenticarUsuarioDemo } = await import('../src/config/demoUsers')

    expect(autenticarUsuarioDemo(email, '').tipo).toBe('credenciais-invalidas')
  })

  it('recusa papel vazio ou desconhecido e registra somente a chave da configuração', async () => {
    const credenciais = credenciaisDemoConfiguradas()[0]
    vi.stubEnv('VITE_DEMO_USER_1_ROLE', '')
    vi.resetModules()
    const { autenticarUsuarioDemo } = await import('../src/config/demoUsers')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(autenticarUsuarioDemo(credenciais.email, credenciais.senha).tipo).toBe('perfil-invalido')
    expect(warn).toHaveBeenCalledWith('VITE_DEMO_USER_1_ROLE')
    expect(JSON.stringify(warn.mock.calls)).not.toContain(credenciais.senha)

    vi.stubEnv('VITE_DEMO_USER_1_ROLE', 'UNKNOWN_ROLE')
    vi.resetModules()
    const segundoAviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const recarregado = await import('../src/config/demoUsers')
    expect(recarregado.autenticarUsuarioDemo(credenciais.email, credenciais.senha).tipo).toBe('perfil-invalido')
    expect(segundoAviso).toHaveBeenCalledWith('VITE_DEMO_USER_1_ROLE')
    expect(JSON.stringify(segundoAviso.mock.calls)).not.toContain('UNKNOWN_ROLE')
    expect(JSON.stringify(segundoAviso.mock.calls)).not.toContain(credenciais.senha)
  })

  it('não aceita o marcador de senha não preenchido', async () => {
    const email = env.VITE_DEMO_USER_1_EMAIL ?? ''
    vi.stubEnv('VITE_DEMO_USER_1_PASSWORD', 'PREENCHER_NO_VSCODE')
    vi.resetModules()
    const { autenticarUsuarioDemo } = await import('../src/config/demoUsers')

    expect(autenticarUsuarioDemo(email, 'PREENCHER_NO_VSCODE').tipo).toBe('credenciais-invalidas')
  })
})
