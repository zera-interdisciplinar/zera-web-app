import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { carregarEnvDemoNosTestes } from './envDemo'

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

beforeEach(() => {
  carregarEnvDemoNosTestes()
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('autenticação demo por ambiente', () => {
  it('aceita os três usuários configurados e converte ADMIN para gestor', async () => {
    const credenciais = credenciaisDemoConfiguradas()
    const { autenticarUsuarioDemo } = await import('./mocks/demoUsers')
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

  it('mapeia ADMIN para MANAGER sem depender das senhas do ambiente local', async () => {
    const email = 'admin-teste@zera.com'
    const senha = randomUUID()
    vi.stubEnv('VITE_DEMO_USER_1_EMAIL', email)
    vi.stubEnv('VITE_DEMO_USER_1_PASSWORD', senha)
    vi.stubEnv('VITE_DEMO_USER_1_ROLE', 'ADMIN')
    vi.stubEnv('VITE_DEMO_USER_1_NAME', 'Admin de teste')
    vi.resetModules()
    const { autenticarUsuarioDemo } = await import('./mocks/demoUsers')

    expect(autenticarUsuarioDemo(email, senha)).toMatchObject({
      tipo: 'autenticado',
      usuario: { perfil: 'gestor' },
    })
  })

  it('recusa domínio externo e usuário não cadastrado', async () => {
    const { autenticarUsuarioDemo } = await import('./mocks/demoUsers')

    expect(autenticarUsuarioDemo('fora@exemplo.invalid', '').tipo).toBe('credenciais-invalidas')
    expect(autenticarUsuarioDemo('nao-cadastrado@zera.com', '').tipo).toBe('credenciais-invalidas')
  })

  it('ignora configuração com campo vazio', async () => {
    const email = env.VITE_DEMO_USER_1_EMAIL ?? ''
    vi.stubEnv('VITE_DEMO_USER_1_NAME', '')
    vi.resetModules()
    const { autenticarUsuarioDemo } = await import('./mocks/demoUsers')

    expect(autenticarUsuarioDemo(email, '').tipo).toBe('credenciais-invalidas')
  })

  it('recusa papel vazio ou desconhecido e registra somente a chave da configuração', async () => {
    const email = 'perfil-teste@zera.com'
    const senha = randomUUID()
    vi.stubEnv('VITE_DEMO_USER_1_EMAIL', email)
    vi.stubEnv('VITE_DEMO_USER_1_PASSWORD', senha)
    vi.stubEnv('VITE_DEMO_USER_1_NAME', 'Usuário de teste')
    vi.stubEnv('VITE_DEMO_USER_1_ROLE', '')
    vi.resetModules()
    const { autenticarUsuarioDemo } = await import('./mocks/demoUsers')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(autenticarUsuarioDemo(email, senha).tipo).toBe('perfil-invalido')
    expect(warn).toHaveBeenCalledWith('VITE_DEMO_USER_1_ROLE')
    expect(JSON.stringify(warn.mock.calls)).not.toContain(senha)

    vi.stubEnv('VITE_DEMO_USER_1_ROLE', 'UNKNOWN_ROLE')
    vi.resetModules()
    const segundoAviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const recarregado = await import('./mocks/demoUsers')
    expect(recarregado.autenticarUsuarioDemo(email, senha).tipo).toBe('perfil-invalido')
    expect(segundoAviso).toHaveBeenCalledWith('VITE_DEMO_USER_1_ROLE')
    expect(JSON.stringify(segundoAviso.mock.calls)).not.toContain('UNKNOWN_ROLE')
    expect(JSON.stringify(segundoAviso.mock.calls)).not.toContain(senha)
  })

  it('não aceita o marcador de senha não preenchido', async () => {
    const email = env.VITE_DEMO_USER_1_EMAIL ?? ''
    vi.stubEnv('VITE_DEMO_USER_1_PASSWORD', 'PREENCHER_NO_VSCODE')
    vi.resetModules()
    const { autenticarUsuarioDemo } = await import('./mocks/demoUsers')

    expect(autenticarUsuarioDemo(email, 'PREENCHER_NO_VSCODE').tipo).toBe('credenciais-invalidas')
  })
})
