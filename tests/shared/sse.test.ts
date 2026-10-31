import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseSseChunk } from '../../src/utils/parseSseChunk'
import { createSseClient } from '../../src/services/sseClient'
import type { ApiError } from '../../src/utils/apiError'
import type { StreamEvent, StreamState, SessionPort } from '../../src/types/http'


const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
const eventStream = (...frames: string[]) => {
  const encoder = new TextEncoder()
  return new Response(new ReadableStream({ start(controller) { frames.forEach((text) => controller.enqueue(encoder.encode(text))); controller.close() } }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}
/** A stream that stays open until the test (or the client) closes it. */
const openStream = () => {
  const encoder = new TextEncoder()
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const response = new Response(new ReadableStream({ start(c) { controller = c } }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  return { response, push: (text: string) => controller.enqueue(encoder.encode(text)), close: () => controller.close() }
}
const problem = (status: number, body: unknown = { detail: 'x' }) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('parseSseChunk', () => {
  it('handles CRLF split between chunks, comments and named events', () => {
    let result = parseSseChunk('', ': heartbeat\r\nevent: snapshot\r\ndata: {"a":1}\r')
    expect(result.events).toEqual([])
    result = parseSseChunk(result.rest, '\n\r\n: heartbeat\n\nevent: unavailable\ndata: {"detail":"x"}\n\n')
    expect(result.events).toEqual([{ event: 'snapshot', data: '{"a":1}' }, { event: 'unavailable', data: '{"detail":"x"}' }])
    expect(result.rest).toBe('')
  })

  it('joins multiple data lines and keeps an unfinished event for the next chunk', () => {
    const first = parseSseChunk('', 'event: snapshot\ndata: {"a":\ndata: 1}\n\nevent: snap')
    expect(first.events).toEqual([{ event: 'snapshot', data: '{"a":\n1}' }])
    expect(parseSseChunk(first.rest, 'shot\ndata: 2\n\n').events).toEqual([{ event: 'snapshot', data: '2' }])
  })

  it('ignores a byte-order mark and blocks without data', () => {
    expect(parseSseChunk('', '﻿event: ping\n\nevent: snapshot\ndata: 1\n\n').events).toEqual([{ event: 'snapshot', data: '1' }])
  })
})

describe('sse client', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>
  let session: SessionPort & { token: string | null; expired: number; refreshes: number; renewable: boolean }
  let events: StreamEvent[]
  let states: StreamState[]
  let fatals: ApiError[]
  let delays: number[]
  const handlers = () => ({ onEvent: (event: StreamEvent) => events.push(event), onState: (state: StreamState) => states.push(state), onFatal: (error: ApiError) => fatals.push(error) })
  const client = (extra: Partial<Parameters<typeof createSseClient>[0]> = {}) => createSseClient({
    baseUrls: { administrative: '/a', inventory: '/i', analytics: '/api/analytics' }, session, fetchImpl: fetchMock, origin: 'https://app.example.invalid',
    sleep: async (ms) => { delays.push(ms) }, ...extra,
  })

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>()
    events = []; states = []; fatals = []; delays = []
    session = {
      token: 'access-1', expired: 0, refreshes: 0, renewable: true,
      getAccessToken() { return this.token }, getUnitId: () => 'unit-1',
      async refresh() { this.refreshes += 1; if (this.renewable) this.token = 'access-2'; return this.renewable },
      onExpired() { this.expired += 1 },
    }
  })

  it('sends the JWT and the unit in headers, never in the URL, and delivers snapshot and unavailable (BR-23)', async () => {
    const controller = new AbortController()
    const live = openStream()
    fetchMock.mockResolvedValue(live.response)
    const done = client().connect('analytics', '/api/v1/dashboard/overview', { query: { period: '6m', view: 'todos', q: undefined, category: '' }, signal: controller.signal, handlers: handlers() })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
    live.push(': heartbeat\n\n' + frame('snapshot', { batch_id: 'b1' }) + frame('unavailable', { detail: 'snapshot not ready' }))
    await vi.waitFor(() => expect(events).toHaveLength(2))
    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.toString()).toBe('https://app.example.invalid/api/analytics/api/v1/dashboard/overview?period=6m&view=todos')
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ Accept: 'text/event-stream', Authorization: 'Bearer access-1', 'X-Unit-Id': 'unit-1' })
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'omit', redirect: 'error', cache: 'no-store' })
    expect(events).toEqual([{ name: 'snapshot', data: { batch_id: 'b1' } }, { name: 'unavailable', data: { detail: 'snapshot not ready' } }])
    expect(states).toEqual(['connecting', 'open'])
    controller.abort()
    await done
    expect(fatals).toEqual([])
  })

  it('keeps the connection open: it does not reopen while the stream is alive (no polling)', async () => {
    const controller = new AbortController()
    const live = openStream()
    fetchMock.mockResolvedValue(live.response)
    const done = client().connect('analytics', '/api/v1/dashboard/overview', { signal: controller.signal, handlers: handlers() })
    live.push(frame('snapshot', { batch_id: 'b1' }))
    await vi.waitFor(() => expect(events).toHaveLength(1))
    live.push(frame('snapshot', { batch_id: 'b2' }))
    await vi.waitFor(() => expect(events).toHaveLength(2))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    controller.abort()
    await done
  })

  it('reopens after the stream ends, with a 1 s pause, and delivers the new batch', async () => {
    const controller = new AbortController()
    const live = openStream()
    fetchMock.mockResolvedValueOnce(eventStream(frame('snapshot', { batch_id: 'b1' }))).mockResolvedValueOnce(live.response)
    const done = client().connect('analytics', '/x', { signal: controller.signal, handlers: handlers() })
    live.push(frame('snapshot', { batch_id: 'b2' }))
    await vi.waitFor(() => expect(events.map((event) => (event.data as { batch_id: string }).batch_id)).toEqual(['b1', 'b2']))
    expect(delays).toEqual([1000])
    expect(states).toEqual(['connecting', 'open', 'reconnecting', 'reconnecting', 'open'])
    controller.abort()
    await done
  })

  it('backs off 1, 2, 4... seconds up to 30 s while the network is down', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementation(async () => { if (delays.length >= 8) controller.abort(); throw new TypeError('Failed to fetch') })
    await client().connect('analytics', '/x', { signal: controller.signal, handlers: handlers() })
    expect(delays.slice(0, 8)).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000])
    expect(fatals).toEqual([])
  })

  it('stops for good on 400 (bad filters), without reconnecting', async () => {
    fetchMock.mockResolvedValue(problem(400, { detail: 'period inválido' }))
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(fatals).toHaveLength(1)
    expect(fatals[0]).toMatchObject({ status: 400, detail: 'period inválido' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('ends the session on 403 and does not reconnect', async () => {
    fetchMock.mockResolvedValue(problem(403))
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(session.expired).toBe(1)
    expect(fatals[0]).toMatchObject({ status: 403 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('renews the session once on 401 and reopens with the new token', async () => {
    const controller = new AbortController()
    const live = openStream()
    fetchMock.mockResolvedValueOnce(problem(401)).mockResolvedValueOnce(live.response)
    const done = client().connect('analytics', '/x', { signal: controller.signal, handlers: handlers() })
    live.push(frame('snapshot', { batch_id: 'b1' }))
    await vi.waitFor(() => expect(events).toHaveLength(1))
    expect(session.refreshes).toBe(1)
    expect((fetchMock.mock.calls[1][1]?.headers as Record<string, string>).Authorization).toBe('Bearer access-2')
    expect(session.expired).toBe(0)
    controller.abort()
    await done
  })

  it('ends the session when the 401 cannot be renewed, or happens again right after renewing', async () => {
    session.renewable = false
    fetchMock.mockResolvedValue(problem(401))
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(session.expired).toBe(1)
    expect(fatals[0]).toMatchObject({ kind: 'session', status: 401 })
    fatals = []; session.expired = 0; session.renewable = true; fetchMock.mockReset().mockResolvedValue(problem(401))
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(session.expired).toBe(1)
    expect(fatals).toHaveLength(1)
  })

  it('retries on 502/503/504 instead of giving up', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementation(async () => { if (delays.length >= 2) controller.abort(); return problem(503) })
    await client().connect('analytics', '/x', { signal: controller.signal, handlers: handlers() })
    expect(fatals).toEqual([])
    expect(delays).toEqual([1000, 2000])
  })

  it('treats an error event as fatal and forwards status and detail', async () => {
    fetchMock.mockResolvedValue(eventStream(frame('error', { status: 400, detail: 'unit_id inválido' })))
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(fatals[0]).toMatchObject({ status: 400, detail: 'unit_id inválido' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refuses an event with invalid JSON and a response that is not an event stream', async () => {
    fetchMock.mockResolvedValue(eventStream('event: snapshot\ndata: {broken\n\n'))
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(fatals[0]).toMatchObject({ kind: 'contract' })
    fatals = []
    fetchMock.mockReset().mockResolvedValue(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(fatals[0]).toMatchObject({ kind: 'contract' })
  })

  it('reconnects when the connection goes silent past the inactivity window', async () => {
    const controller = new AbortController()
    const silent = openStream()
    const live = openStream()
    fetchMock.mockResolvedValueOnce(silent.response).mockImplementation(async () => live.response)
    const done = client({ inactivityMs: 300 }).connect('analytics', '/x', { signal: controller.signal, handlers: handlers() })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    live.push(frame('snapshot', { batch_id: 'b' }))
    await vi.waitFor(() => expect(events).toHaveLength(1))
    controller.abort()
    await done
  })

  it('fails without a token and refuses an insecure remote base', async () => {
    session.token = null
    await client().connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(fatals[0]).toMatchObject({ kind: 'session' })
    expect(session.expired).toBe(1)
    fatals = []
    session.token = 'a'
    await createSseClient({ baseUrls: { administrative: '', inventory: '', analytics: 'http://remote.example.invalid' }, session, fetchImpl: fetchMock })
      .connect('analytics', '/x', { signal: new AbortController().signal, handlers: handlers() })
    expect(fatals[0]).toMatchObject({ kind: 'config' })
  })

  it('stops reading and never reopens once aborted', async () => {
    const controller = new AbortController()
    const live = openStream()
    fetchMock.mockResolvedValue(live.response)
    const done = client().connect('analytics', '/x', { signal: controller.signal, handlers: handlers() })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
    controller.abort()
    await done
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(delays).toEqual([])
  })
})
