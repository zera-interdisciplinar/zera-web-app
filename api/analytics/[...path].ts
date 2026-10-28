import type { IncomingMessage, ServerResponse } from 'node:http'
import { criarProxy } from '../../server/proxy.mjs'
import { configuracaoProxy } from '../../server/config.mjs'

export const maxDuration = 300
export const config = { api: { bodyParser: false } }

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return criarProxy(configuracaoProxy())(req, res)
}
