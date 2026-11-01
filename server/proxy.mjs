// Encaminha chamadas às APIs e preserva respostas JSON e SSE sem expor segredos.
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { configuracaoProxy, origemPermitida, portaProxy, validarBaseProxy } from './config.mjs'

function identidadeToken(authorization) {
  if (typeof authorization !== 'string') return null
  const correspondencia = authorization.match(/^Bearer\s+[^.]+\.([^.]+)\.[^.]+$/)
  if (!correspondencia) return null
  try {
    const claims = JSON.parse(Buffer.from(correspondencia[1], 'base64url').toString('utf8'))
    if (typeof claims.sub !== 'string' || !claims.sub.trim() || typeof claims.role !== 'string' || !claims.role.trim()) return null
    return { id: claims.sub, role: claims.role }
  } catch { return null }
}

function responderErro(res, status, mensagem) {
  const titulo = status === 401 ? 'Unauthorized' : status === 404 ? 'Not Found' : 'Bad Gateway'
  res.writeHead(status, { 'Content-Type': 'application/problem+json' })
  res.end(JSON.stringify({ type: 'about:blank', title: titulo, status, detail: mensagem }))
}

function metodosPermitidos(servico, caminho) {
  const segmento = "[A-Za-z0-9._~-]+"
  if (servico === "administrative") {
    if (/^\/api\/v1\/auth\/(?:login|refresh)$/.test(caminho)) return ["POST"]
    if (caminho === "/api/v1/users") return ["GET"]
    if (new RegExp("^/api/v1/users/" + segmento + "$").test(caminho)) return ["GET"]
    if (caminho === "/api/v1/recycling-places") return ["GET"]
    if (caminho === "/api/v1/recyclings") return ["GET", "POST"]
    return []
  }
  if (servico === "analytics") return caminho === "/health" || caminho === "/api/v1/dashboard/overview" ? ["GET"] : []
  if (servico !== "inventory") return []
  if (["/api/v1/items", "/api/v1/models", "/api/v1/categories", "/api/v1/disposals"].includes(caminho)) return ["GET", "POST"]
  if (["/api/v1/materials", "/api/v1/unit-settings", "/api/v1/dashboard/home", "/api/v1/dashboard/by-category", "/api/v1/dashboard/indicators"].includes(caminho)) return ["GET"]
  if (/^\/api\/v1\/items\/by-barcode\/[A-Za-z0-9._~-]+$/.test(caminho)) return ["GET"]
  if (/^\/api\/v1\/items\/[A-Za-z0-9._~-]+\/events$/.test(caminho)) return ["GET"]
  if (/^\/api\/v1\/items\/[A-Za-z0-9._~-]+$/.test(caminho)) return ["GET", "PATCH", "DELETE"]
  if (/^\/api\/v1\/items\/[A-Za-z0-9._~-]+\/(?:submit|approve|reject|lend|return|evaluate|maintenance\/(?:start|finish))$/.test(caminho)) return ["POST"]
  return []
}
/**
 * @param {{ administrative?: string, inventory?: string, analytics?: string, apiKey?: string, origins?: string[] }} options
 * @returns {import('node:http').RequestListener}
 */
export function criarProxy({ administrative, inventory, analytics, apiKey, origins = ['http://localhost:5173', 'http://127.0.0.1:5173'] }) {
  const bases = { administrative, inventory, analytics }
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    const origin = req.headers.origin
    if (!origemPermitida(origin, req.headers.host, origins)) { res.writeHead(403); res.end(); return }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin') }
    let route
    try { route = new URL(req.url ?? '/', 'http://localhost') }
    catch { res.writeHead(400); res.end(); return }
    const match = route.pathname.match(/^\/(?:api\/)?(administrative|inventory|analytics)(\/api\/v1\/[A-Za-z0-9/_.%~-]+|\/health)$/)
    if (!match) {
      res.writeHead(404); res.end(); return
    }
    const metodosDaRota = metodosPermitidos(match[1], match[2])
    if (req.method === 'OPTIONS') {
      if (metodosDaRota.length === 0) { res.writeHead(404); res.end(); return }
      const metodoSolicitado = req.headers['access-control-request-method']
      if (typeof metodoSolicitado === 'string' && !metodosDaRota.includes(metodoSolicitado)) {
        res.writeHead(404); res.end(); return
      }
      const cabecalhosPermitidos = new Set(['authorization', 'content-type', 'x-unit-id'])
      const cabecalhosSolicitados = (req.headers['access-control-request-headers'] ?? '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
      if (cabecalhosSolicitados.some((cabecalho) => !cabecalhosPermitidos.has(cabecalho))) {
        res.writeHead(403); res.end(); return
      }
      res.setHeader('Access-Control-Allow-Methods', metodosDaRota.join(', '))
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Unit-Id')
      res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
      res.writeHead(204); res.end(); return
    }
    if (!metodosDaRota.includes(req.method ?? '')) {
      res.writeHead(404); res.end(); return
    }
    if (route.searchParams.has('access_token')) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ detail: 'Envie o JWT no header Authorization, nunca na URL.' })); return
    }
    const base = bases[match[1]]
    if (!base || !apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ mensagem: 'O serviço ainda não foi configurado.' })); return
    }
    const listaItens = match[1] === 'inventory' && req.method === 'GET' && match[2] === '/api/v1/items'
    const eventoItem = match[1] === 'inventory' && req.method === 'GET' && /^\/api\/v1\/items\/[^/]+\/events$/.test(match[2])
    const leituraItem = match[1] === 'inventory' && req.method === 'GET'
      && /^\/api\/v1\/items\/(?:by-barcode\/[^/]+|[^/]+)$/.test(match[2])
    const rotaItem = listaItens || eventoItem || leituraItem
    const detalheItem = leituraItem
    let identidade = null
    if (rotaItem && req.headers.authorization !== undefined) {
      identidade = identidadeToken(req.headers.authorization)
      if (!identidade) { responderErro(res, 401, 'Entre novamente para consultar este item.'); return }
    }
    try {
      const url = new URL(`${validarBaseProxy(base)}${match[2]}${route.search}`)
      if (rotaItem && !detalheItem && identidade?.role === 'EMPLOYEE') {
        // O ms-inventory aplica este filtro no servidor e recalcula a paginação.
        url.searchParams.set('createdBy', identidade.id)
      }
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 64 * 1024) { res.writeHead(413); res.end(); return }
        chunks.push(chunk)
      }
      const headers = { Accept: match[1] === 'analytics' && match[2] !== '/health' ? 'text/event-stream' : 'application/json', apiKey }
      for (const header of ['authorization', 'x-unit-id', 'content-type']) {
        const value = req.headers[header]
        if (typeof value === 'string') headers[header] = value
      }
      const abort = new AbortController()
      const cancel = () => { if (!res.writableEnded) abort.abort() }
      res.once('close', cancel)
      // Limita a abertura, nao a vida do SSE; heartbeats podem continuar por minutos.
      const timeout = setTimeout(() => abort.abort(), match[1] === 'analytics' ? 180_000 : 15_000)
      try {
        if (eventoItem && identidade?.role === 'EMPLOYEE') {
          const caminhoDoItem = match[2].replace(/\/events$/, '')
          const respostaDoItem = await fetch(new URL(`${validarBaseProxy(base)}${caminhoDoItem}`), {
            method: 'GET', headers, redirect: 'error', signal: abort.signal,
          })
          if (respostaDoItem.status === 403 || respostaDoItem.status === 404) {
            responderErro(res, 404, 'Recurso não encontrado.')
            return
          }
          if (!respostaDoItem.ok) {
            responderErro(res, 502, 'Não foi possível verificar o responsável pelo item.')
            return
          }
          let itemDosEventos
          try { itemDosEventos = await respostaDoItem.json() }
          catch { responderErro(res, 502, 'Não foi possível verificar o responsável pelo item.'); return }
          if (typeof itemDosEventos?.createdBy !== 'string' || !itemDosEventos.createdBy.trim()) {
            responderErro(res, 502, 'Não foi possível verificar o responsável pelo item.')
            return
          }
          if (itemDosEventos.createdBy !== identidade.id) {
            responderErro(res, 404, 'Recurso não encontrado.')
            return
          }
        }
        const response = await fetch(url, {
          method: req.method,
          headers,
          body: chunks.length ? Buffer.concat(chunks) : undefined,
          redirect: 'error',
          signal: abort.signal,
        })
      if (listaItens && identidade?.role === 'EMPLOYEE' && response.ok) {
        let pagina
        try { pagina = await response.json() }
        catch { responderErro(res, 502, 'Não foi possível verificar o responsável pelos itens.'); return }
        if (!pagina || typeof pagina !== 'object' || !Array.isArray(pagina.content)
          || !Number.isInteger(pagina.totalPages) || pagina.totalPages < 0 || pagina.totalPages > 1000) {
          responderErro(res, 502, 'Não foi possível verificar o responsável pelos itens.'); return
        }
        const itens = [...pagina.content]
        for (let numeroPagina = 1; numeroPagina < pagina.totalPages; numeroPagina += 1) {
          const urlPagina = new URL(url)
          urlPagina.searchParams.set('page', String(numeroPagina))
          const respostaPagina = await fetch(urlPagina, { method: 'GET', headers, redirect: 'error', signal: abort.signal })
          if (!respostaPagina.ok) {
            const tipo = respostaPagina.headers.get('content-type')
            if (tipo) res.setHeader('Content-Type', tipo)
            res.writeHead(respostaPagina.status)
            res.end(await respostaPagina.text())
            return
          }
          let paginaSeguinte
          try { paginaSeguinte = await respostaPagina.json() }
          catch { responderErro(res, 502, 'Não foi possível verificar o responsável pelos itens.'); return }
          if (!paginaSeguinte || typeof paginaSeguinte !== 'object' || !Array.isArray(paginaSeguinte.content)) {
            responderErro(res, 502, 'Não foi possível verificar o responsável pelos itens.'); return
          }
          itens.push(...paginaSeguinte.content)
        }
        if (itens.some((item) => !item || typeof item.createdBy !== 'string' || !item.createdBy.trim())) {
          responderErro(res, 502, 'Não foi possível verificar o responsável pelos itens.'); return
        }
        const itensDoFuncionario = itens.filter((item) => item.createdBy === identidade.id)
        const paginaSegura = {
          ...pagina,
          content: itensDoFuncionario,
          page: 0,
          size: itensDoFuncionario.length,
          totalElements: itensDoFuncionario.length,
          totalPages: itensDoFuncionario.length > 0 ? 1 : 0,
        }
        clearTimeout(timeout)
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(response.status)
        res.end(JSON.stringify(paginaSegura))
        return
      }
        clearTimeout(timeout)
        if (detalheItem && identidade?.role === 'EMPLOYEE' && response.ok) {
          let item
          try { item = await response.clone().json() }
          catch { responderErro(res, 502, 'Não foi possível verificar o responsável pelo item.'); return }
          if (typeof item?.createdBy !== 'string' || !item.createdBy.trim()) {
            responderErro(res, 502, 'Não foi possível verificar o responsável pelo item.'); return
          }
          if (item.createdBy !== identidade.id) { responderErro(res, 404, 'Recurso não encontrado.'); return }
        }
        const contentType = response.headers.get('content-type')
        if (contentType) res.setHeader('Content-Type', contentType)
        if (contentType?.includes('text/event-stream')) {
          res.setHeader('Cache-Control', 'no-cache, no-transform')
          res.setHeader('X-Accel-Buffering', 'no')
        }
        res.writeHead(response.status)
        res.flushHeaders()
        if (response.body) await pipeline(Readable.fromWeb(response.body), res)
        else res.end()
      } finally { clearTimeout(timeout); res.off('close', cancel) }
    } catch {
      if (res.destroyed) return
      if (res.headersSent) { res.destroy(); return }
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ mensagem: 'Não foi possível acessar o serviço do ZERA.' }))
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let env = {}
  for (const file of ['.env', '.env.local']) {
    try { env = { ...env, ...parseEnv(readFileSync(file, 'utf8')) } }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  env = { ...env, ...process.env }
  const port = portaProxy(env.ZERA_PROXY_PORT)
  const proxy = criarProxy(configuracaoProxy(env))
  createServer(proxy).listen(port, '127.0.0.1', () => process.stdout.write(`Proxy ZERA disponível em http://127.0.0.1:${port}\n`))
}
