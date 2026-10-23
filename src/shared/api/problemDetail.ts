/** Reads error bodies from the three backends: Spring ProblemDetail, Kong `{ message }` and FastAPI `{ detail }`. */
export interface Problem {
  title?: string
  detail?: string
  fieldErrors: Record<string, string>
  missingFields: string[]
}

const FIELD_MESSAGE = /^([A-Za-z_][\w.[\]]*): (.+)$/

/** Spring validation errors come as `"email: must not be blank, password: must not be blank"`. */
export function parseFieldErrors(detail: string): Record<string, string> {
  const pieces = detail.split(/,\s+(?=[A-Za-z_][\w.[\]]*: )/)
  const fields: Record<string, string> = {}
  for (const piece of pieces) {
    const match = FIELD_MESSAGE.exec(piece.trim())
    if (!match) return {}
    fields[match[1]] = match[2]
  }
  return fields
}

export function parseProblem(body: unknown): Problem {
  if (typeof body !== 'object' || body === null) return { fieldErrors: {}, missingFields: [] }
  const record = body as Record<string, unknown>
  const detail = typeof record.detail === 'string' ? record.detail : typeof record.message === 'string' ? record.message : undefined
  const missing = Array.isArray(record.missingFields) ? record.missingFields.filter((field): field is string => typeof field === 'string') : []
  return {
    title: typeof record.title === 'string' ? record.title : undefined,
    detail,
    fieldErrors: detail ? parseFieldErrors(detail) : {},
    missingFields: missing,
  }
}
