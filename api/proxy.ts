// Adapta o proxy Node para a função serverless da Vercel.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { criarProxy } from '../server/proxy.mjs'
import { configuracaoProxy, restaurarCaminhoProxy } from '../server/config.mjs'

export const maxDuration = 300
export const config = { api: { bodyParser: false } }

export default function handler(req: IncomingMessage, res: ServerResponse) {
  req.url = restaurarCaminhoProxy(req.url ?? '/')
  return criarProxy(configuracaoProxy())(req, res)
}
