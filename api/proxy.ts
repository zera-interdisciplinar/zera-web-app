// Adapts the Node proxy to a Vercel serverless function.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createProxy } from '../server/proxy.mjs'
import { proxyConfig, restoreProxyPath } from '../server/config.mjs'

export const maxDuration = 300
export const config = { api: { bodyParser: false } }

export default function handler(req: IncomingMessage, res: ServerResponse) {
  req.url = restoreProxyPath(req.url ?? '/')
  return createProxy(proxyConfig())(req, res)
}
