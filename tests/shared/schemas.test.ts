import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { isoDate, isoDateTime, pageSchema } from '../../src/shared/api/schemas'
import { createQueryClient } from '../../src/shared/api/queryClient'

const page = pageSchema(z.object({ id: z.string() }))

describe('pageSchema', () => {
  it('accepts the inventory envelope and the empty page', () => {
    expect(page.safeParse({ content: [{ id: 'a' }], page: 0, size: 20, totalElements: 1, totalPages: 1 }).success).toBe(true)
    expect(page.safeParse({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }).success).toBe(true)
  })

  it.each([
    { content: [{ id: 'a' }, { id: 'b' }], page: 0, size: 20, totalElements: 1, totalPages: 1 },
    { content: [], page: 0, size: 20, totalElements: 5, totalPages: 0 },
    { content: [], page: 0, size: 20, totalElements: 0, totalPages: 3 },
    { content: [{ id: 1 }], page: 0, size: 20, totalElements: 1, totalPages: 1 },
    { content: {}, page: 0, size: 20, totalElements: 0, totalPages: 0 },
    { content: [], page: -1, size: 20, totalElements: 0, totalPages: 0 },
  ])('rejects an inconsistent page %j', (value) => {
    expect(page.safeParse(value).success).toBe(false)
  })
})

describe('date schemas', () => {
  it.each(['2026-10-31', '2026-02-28'])('accepts the date %s', (value) => { expect(isoDate.safeParse(value).success).toBe(true) })
  it.each(['2026-02-30', '31/10/2026', 'ontem', ''])('rejects the date %s', (value) => { expect(isoDate.safeParse(value).success).toBe(false) })
  it.each(['2026-10-28T14:12:00', '2026-10-28T14:12:00Z', '2026-10-28T14:12:00.123-03:00'])('accepts the date-time %s', (value) => { expect(isoDateTime.safeParse(value).success).toBe(true) })
  it.each(['2026-10-28', 'ontem', '2026-13-01T00:00:00'])('rejects the date-time %s', (value) => { expect(isoDateTime.safeParse(value).success).toBe(false) })
})

describe('createQueryClient', () => {
  it('leaves retries to the HTTP client and avoids refetching on focus', () => {
    const defaults = createQueryClient().getDefaultOptions()
    expect(defaults.queries).toMatchObject({ retry: false, staleTime: 30_000, refetchOnWindowFocus: false })
    expect(defaults.mutations).toMatchObject({ retry: false })
  })
})
