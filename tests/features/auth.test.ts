import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../src/shared/api/errors'
import { AuthRejectedError } from '../../src/shared/auth/gate'
import { describeLoginError, safeRedirect } from '../../src/features/auth/loginErrors'
import { fieldErrors, forgotPasswordSchema, loginSchema } from '../../src/features/auth/schemas'
import { forgotCopy } from '../../src/features/auth/copy'

describe('loginSchema', () => {
  it('normalizes the e-mail and keeps the password exactly as typed', () => {
    const result = loginSchema.parse({ email: '  Natalia@Example.INVALID ', password: ' senha com espaços ' })
    expect(result).toEqual({ email: 'natalia@example.invalid', password: ' senha com espaços ' })
  })

  it.each([
    [{ email: '', password: 'x' }, 'email', 'Informe o e-mail.'],
    [{ email: 'sem-arroba', password: 'x' }, 'email', 'E-mail inválido'],
    [{ email: 'a@b', password: 'x' }, 'email', 'E-mail inválido'],
    [{ email: `${'a'.repeat(120)}@b.co`, password: 'x' }, 'email', 'longo demais'],
    [{ email: 'a@b.co', password: '' }, 'password', 'Informe a senha.'],
    [{ email: 'a@b.co', password: 'x'.repeat(129) }, 'password', 'longa demais'],
  ])('rejects %j', (input, field, message) => {
    const parsed = loginSchema.safeParse(input)
    expect(parsed.success).toBe(false)
    expect(fieldErrors<'email' | 'password'>(parsed.error!)[field as 'email' | 'password']).toContain(message)
  })

  it('does not enforce a company domain', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'gestora@empresa.com.br' }).success).toBe(true)
  })
})

describe('describeLoginError', () => {
  it('shows the manager-only message without counting a failed attempt (BR-01)', () => {
    const failure = describeLoginError(new AuthRejectedError('not-manager'))
    expect(failure.message).toBe('Esta área é exclusiva para gestores. Use o app Zera.')
    expect(failure.countsAsAttempt).toBe(false)
  })

  it.each([400, 401, 403])('treats HTTP %s as wrong credentials', (status) => {
    expect(describeLoginError(new ApiError('x', { kind: 'http', status }))).toEqual({ message: 'E-mail ou senha inválidos.', countsAsAttempt: true })
  })

  it.each([
    [new ApiError('x', { kind: 'network' })],
    [new ApiError('x', { kind: 'timeout' })],
    [new ApiError('x', { kind: 'http', status: 503 })],
  ])('treats %j as an unavailable server', (error) => {
    const failure = describeLoginError(error)
    expect(failure.message).toBe('Servidor de autenticação indisponível. Tente novamente mais tarde.')
    expect(failure.countsAsAttempt).toBe(false)
  })

  it('never exposes the server detail', () => {
    expect(describeLoginError(new ApiError('SQL internal detail', { kind: 'http', status: 500, detail: 'SQL internal detail' })).message).not.toContain('SQL')
    expect(describeLoginError(new ApiError('x', { kind: 'contract', status: 200 })).message).toBe('Resposta inválida do serviço de autenticação.')
    expect(describeLoginError(new Error('boom')).message).toBe('Não foi possível concluir o login.')
  })
})

describe('safeRedirect', () => {
  it.each([
    [{ from: '/itens?status=PENDING_APPROVAL' }, '/itens?status=PENDING_APPROVAL'],
    [{ from: '/modelos' }, '/modelos'],
    [{ from: '//evil.example.invalid' }, '/'],
    [{ from: 'https://evil.example.invalid' }, '/'],
    [{ from: '/\\evil' }, '/'],
    [{ from: 42 }, '/'],
    [null, '/'],
    ['/itens', '/'],
  ])('maps %j to %s', (state, expected) => {
    expect(safeRedirect(state)).toBe(expected)
  })
})

describe('login page and recovery', () => {
  const page = readFileSync(new URL('../../src/features/auth/pages/LoginPage.tsx', import.meta.url), 'utf8')

  it('has no demo shortcuts and keeps the contact links', () => {
    for (const text of ['Não tenho cadastro', 'Pré-visualização local', 'Abrir como gestor', 'Abrir como funcionário', 'Voltar']) expect(page).not.toContain(text)
    expect(page).toContain('https://www.instagram.com/zera.app_/')
    expect(page).toContain('mailto:')
    expect(page).not.toContain('tel:')
  })

  it('opens the recovery dialog instead of navigating to a public page', () => {
    expect(page).toContain('ForgotPasswordDialog')
    expect(page).not.toContain('esqueci-senha')
  })

  it('shows one confirmation that does not reveal whether the account exists (BR-19)', () => {
    expect(forgotCopy.confirmation).toContain('Se o e-mail tiver conta ativa')
    const dialog = readFileSync(new URL('../../src/features/auth/components/ForgotPasswordDialog.tsx', import.meta.url), 'utf8')
    expect(dialog).toMatch(/catch \{\s*\/\/[^\n]*\n\s*\}/)
  })
})
