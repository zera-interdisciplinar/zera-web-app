export function configuracaoProxy(env = process.env) {
  return {
    administrative: env.ZERA_ADMIN_URL || env.ZERA_ADMIN_API_ORIGIN,
    inventory: env.ZERA_INVENTORY_API_ORIGIN,
    analytics: env.ZERA_ANALYTICS_URL,
    apiKey: env.ZERA_APP_API_KEY,
    origins: [
      ...(env.ZERA_WEB_ORIGINS ?? 'http://localhost,http://127.0.0.1').split(','),
      ...[env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean).map((host) => `https://${host}`),
    ].map((origin) => origin.trim()),
  }
}

// Rewrites explícitos evitam depender de catch-all do framework do front.
export function restaurarCaminhoProxy(caminho) {
  const url = new URL(caminho, 'http://localhost')
  if (url.pathname !== '/api/proxy') return caminho
  const services = url.searchParams.getAll('__zera_service')
  const paths = url.searchParams.getAll('__zera_path')
  if (services.length !== 1 || paths.length !== 1
    || !['administrative', 'inventory', 'analytics'].includes(services[0])
    || !/^(?:api\/v1\/[A-Za-z0-9/_.%~-]+|health)$/.test(paths[0])) return '/rota-invalida'
  url.searchParams.delete('__zera_service')
  url.searchParams.delete('__zera_path')
  const query = url.searchParams.toString()
  return `/api/${services[0]}/${paths[0]}${query ? `?${query}` : ''}`
}

export function validarBaseProxy(base) {
  const url = new URL(base)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('Transporte inseguro')
  if (url.username || url.password || url.search || url.hash) throw new Error('Base de API invalida')
  if (/\/(?:api|swagger-ui|api-docs)(?:\/|$)/i.test(url.pathname)) throw new Error('Use a base do servico, sem /api ou Swagger')
  return url.toString().replace(/\/+$/, '')
}

export function origemPermitida(origin, host, origins) {
  if (!origin || origins.includes(origin)) return true
  try {
    const url = new URL(origin)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    return url.host === host && (url.protocol === 'https:' || (local && url.protocol === 'http:'))
  } catch { return false }
}
