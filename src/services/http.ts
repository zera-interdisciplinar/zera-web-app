import { env } from '../utils/env'
import { createHttpClient } from './httpClient'
import { createSseClient } from './sseClient'
import type { SessionPort } from '../types/http'

/** Until the auth layer binds a session, every authenticated call fails as "session expired". */
const anonymousSession: SessionPort = {
  getAccessToken: () => null,
  getUnitId: () => null,
  refresh: async () => false,
  onExpired: () => undefined,
}

let session: SessionPort = anonymousSession

/** Called once by the auth layer at startup. */
export function bindSession(port: SessionPort): void {
  session = port
}

const sessionProxy: SessionPort = {
  getAccessToken: () => session.getAccessToken(),
  getUnitId: () => session.getUnitId(),
  refresh: () => session.refresh(),
  onExpired: () => session.onExpired(),
}

/** Application-wide client: every feature talks to the backends through this instance. */
export const http = createHttpClient({ baseUrls: env.apiBaseUrls, session: sessionProxy })

/** Streaming counterpart of `http`, for the analytics dashboard. */
export const sse = createSseClient({ baseUrls: env.apiBaseUrls, session: sessionProxy })
