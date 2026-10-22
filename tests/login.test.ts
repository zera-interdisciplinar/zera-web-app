import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const baseUrl = 'http://localhost:8000/api'
beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', baseUrl)
  vi.stubEnv('VITE_ADMIN_API_URL', baseUrl)
  vi.resetModules()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('login', () => {
  it('não oferece atalhos de pré-visualização e mantém o restante da tela de login', () => {
    const fonte = readFileSync(new URL('../src/pages/LoginPage/index.tsx', import.meta.url), 'utf8')
    for (const texto of [
      'Não tenho cadastro',
      'Pré-visualização local',
      'Abrir como gestor',
      'Abrir como funcionário',
      'Solicitar%20acesso%20ao%20Zera',
      'Voltar',
    ]) {
      expect(fonte).not.toContain(texto)
    }
    expect(fonte).toContain('className={estilos.marca}')
    expect(fonte).toContain('className={estilos.subtitulo}')
    expect(fonte).toContain('Esqueci minha senha')
    expect(fonte).toContain("const emailContato = 'zera.interdisciplinar@gmail.com'")
    expect(fonte).toContain('href={`mailto:${emailContato}`}')
    expect(fonte).not.toContain('tel:')
    expect(fonte).not.toContain('93304-5181')
    expect(fonte).toContain('instagram.com')
    expect(fonte).toContain('https://www.instagram.com/zera.app_/')
    expect(fonte).toContain('@zera.app_')
  })

  it('preserva a senha exatamente como digitada, inclusive espaços nas pontas', async () => {
    const senha = ` ${randomUUID()} `
    const { validarCredenciais } = await import('../src/utils/validacao')
    const resultado = validarCredenciais({ email: 'teste@zera.com', senha })

    expect(resultado.valido).toBe(true)
    expect(resultado.dados.senha).toBe(senha)
  })

  it('mapeia fetch sem resposta como servidor indisponível e não registra credenciais', async () => {
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('detalhe interno', { status: 503 })))
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.resetModules()
    const { autenticar, mensagemErroLogin } = await import('../src/services/authService')

    const falha = await autenticar({ email: 'teste@example.invalid', senha: '' }).catch((erro: unknown) => erro)
    expect(mensagemErroLogin(falha)).toBe('Servidor de autenticação indisponível. Tente novamente mais tarde.')
    expect(mensagemErroLogin(falha)).not.toContain('detalhe interno')
  })
})
