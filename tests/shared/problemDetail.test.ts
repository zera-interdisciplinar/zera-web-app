import { describe, expect, it } from 'vitest'
import { parseFieldErrors, parseProblem } from '../../src/utils/problemDetail'
import { ApiError, describeApiError } from '../../src/utils/apiError'

describe('parseProblem', () => {
  it('reads a Spring ProblemDetail with field errors', () => {
    const problem = parseProblem({ title: 'Bad Request', status: 400, detail: 'email: must not be blank, password: must not be blank', instance: '/x' })
    expect(problem.title).toBe('Bad Request')
    expect(problem.fieldErrors).toEqual({ email: 'must not be blank', password: 'must not be blank' })
  })

  it('reads the missing fields of a 422', () => {
    expect(parseProblem({ status: 422, detail: 'Item 3f2a is missing required fields', missingFields: ['name', 'condition', 7] }).missingFields).toEqual(['name', 'condition'])
  })

  it('reads the Kong and FastAPI shapes', () => {
    expect(parseProblem({ message: 'Unauthorized' }).detail).toBe('Unauthorized')
    expect(parseProblem({ detail: 'unit_id inválido' }).detail).toBe('unit_id inválido')
  })

  it.each([null, undefined, 'text', 42, []])('tolerates an unexpected body %j', (body) => {
    expect(parseProblem(body)).toEqual({ title: undefined, detail: undefined, fieldErrors: {}, missingFields: [] })
  })
})

describe('parseFieldErrors', () => {
  it('does not invent fields from free text', () => {
    expect(parseFieldErrors('inform exactly one of modelId or model')).toEqual({})
    expect(parseFieldErrors('Transition IN_USE to DISPOSED: not allowed, try again')).toEqual({ })
  })

  it('keeps commas inside a message', () => {
    expect(parseFieldErrors('notes: size must be between 0 and 500, name: must not be blank')).toEqual({ notes: 'size must be between 0 and 500', name: 'must not be blank' })
  })
})

describe('describeApiError', () => {
  it('never shows the server detail', () => {
    const error = new ApiError('SQL stack trace', { kind: 'http', status: 500, detail: 'SQL stack trace' })
    expect(describeApiError(error)).not.toContain('SQL')
  })

  it.each([
    [{ kind: 'http', status: 403 }, 'permissão'],
    [{ kind: 'http', status: 409 }, 'estado mudou'],
    [{ kind: 'http', status: 503 }, 'indisponível'],
    [{ kind: 'contract', status: 200 }, 'contrato'],
    [{ kind: 'network' }, 'conexão'],
    [{ kind: 'session', status: 401 }, 'sessão expirou'],
  ] as const)('maps %j', (init, text) => {
    expect(describeApiError(new ApiError('x', init))).toContain(text)
  })

  it('has a generic message for non-API errors', () => {
    expect(describeApiError(new Error('boom'))).toBe('Algo deu errado. Tente novamente.')
  })
})
