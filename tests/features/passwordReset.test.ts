import { describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())
vi.mock('../../src/services/http', () => ({ http: { request } }))

const { requestPasswordReset } = await import('../../src/services/auth')

describe('password reset request (BR-19)', () => {
  it('calls the public endpoint without a token', async () => {
    request.mockResolvedValueOnce(undefined)
    await requestPasswordReset('a@b.c')
    expect(request).toHaveBeenCalledWith('administrative', '/api/v1/auth/password-reset/request', { method: 'POST', body: { email: 'a@b.c' }, auth: false })
  })

  it('resolves the same way when the call fails, so the form cannot probe accounts', async () => {
    request.mockRejectedValueOnce(new Error('network down'))
    await expect(requestPasswordReset('nobody@b.c')).resolves.toBeUndefined()
  })
})
