// Validation of the proxy configuration: service bases, origins and rewritten paths.
export function proxyConfig(env = process.env) {
  return {
    administrative: env.ZERA_ADMIN_URL || env.ZERA_ADMIN_API_ORIGIN,
    inventory: env.ZERA_INVENTORY_URL || env.ZERA_INVENTORY_API_ORIGIN,
    analytics: env.ZERA_ANALYTICS_URL,
    apiKey: env.ZERA_APP_API_KEY,
    origins: (env.ZERA_WEB_ORIGINS ?? 'http://localhost,http://127.0.0.1').split(',').map((origin) => origin.trim()),
  }
}

export function parseProxyPort(value) {
  const port = Number(value?.trim() || '8787')
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid proxy port')
  return port
}

export function validateProxyBase(base) {
  const url = new URL(base)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('Insecure transport')
  if (url.username || url.password || url.search || url.hash) throw new Error('Invalid API base')
  if (/\/(?:api|swagger-ui|api-docs)(?:\/|$)/i.test(url.pathname)) throw new Error('Use the service root, without /api or Swagger')
  return url.toString().replace(/\/+$/, '')
}

export function isAllowedOrigin(origin, host, origins) {
  if (!origin || origins.includes(origin)) return true
  try {
    const url = new URL(origin)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    return url.host === host && (url.protocol === 'https:' || (local && url.protocol === 'http:'))
  } catch { return false }
}
