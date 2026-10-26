export interface RawSseEvent {
  event: string
  data: string
}

/** Parses one event block (the text between two blank lines). Comments and blocks without `data` yield nothing. */
function parseBlock(block: string): RawSseEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue
    const colon = line.indexOf(':')
    const field = colon < 0 ? line : line.slice(0, colon)
    const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') event = value
    if (field === 'data') data.push(value)
  }
  return data.length === 0 ? null : { event, data: data.join('\n') }
}

/**
 * Accepts arbitrary slices of the byte stream: a trailing `\r` may be the first half of a `\r\n`,
 * so it is carried over, and an unfinished event stays in `rest` until the next chunk completes it.
 */
export function parseSseChunk(buffer: string, chunk: string): { events: RawSseEvent[]; rest: string } {
  const combined = `${buffer}${chunk}`
  const endsWithCr = combined.endsWith('\r')
  const normalized = combined.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '')
  const text = endsWithCr ? normalized.slice(0, -1) : normalized
  const blocks = text.split('\n\n')
  const rest = `${blocks.pop() ?? ''}${endsWithCr ? '\r' : ''}`
  const events = blocks.map(parseBlock).filter((event): event is RawSseEvent => event !== null)
  return { events, rest }
}
