// Single source of truth for which upstream routes the browser may reach through the proxy.
// Anything not listed here is answered with 404 (spec: docs/specs/web-manager-refactor.md, 7.2).
const ID = '[A-Za-z0-9_.~%-]+'

/** @type {Record<'administrative' | 'inventory' | 'analytics', Record<string, string[]>>} */
export const ALLOWED_ROUTES = {
  administrative: {
    POST: [
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout',
      '/api/v1/auth/password-reset/request',
    ],
    GET: ['/api/v1/users/{id}', '/api/v1/unit/{id}'],
  },
  inventory: {
    GET: [
      '/api/v1/items',
      '/api/v1/items/{id}',
      '/api/v1/items/{id}/events',
      '/api/v1/models',
      '/api/v1/models/{id}',
      '/api/v1/models/{id}/items',
      '/api/v1/categories',
      '/api/v1/categories/{id}',
      '/api/v1/materials',
      '/api/v1/unit-settings',
    ],
    POST: [
      '/api/v1/items',
      '/api/v1/items/{id}/submit',
      '/api/v1/items/{id}/approve',
      '/api/v1/items/{id}/reject',
      '/api/v1/items/{id}/restore',
      '/api/v1/models',
      '/api/v1/categories',
    ],
    PATCH: [
      '/api/v1/items/{id}',
      '/api/v1/models/{id}/name',
      '/api/v1/models/{id}/manufacturer',
      '/api/v1/models/{id}/warranty-months',
      '/api/v1/models/{id}/expected-lifespan-months',
      '/api/v1/models/{id}/materials',
      '/api/v1/categories/{id}/name',
      '/api/v1/categories/{id}/description',
    ],
    PUT: ['/api/v1/unit-settings'],
    DELETE: ['/api/v1/items/{id}', '/api/v1/models/{id}', '/api/v1/categories/{id}'],
  },
  analytics: {
    GET: ['/health', '/api/v1/dashboard/overview'],
  },
}

const escape = (text) => text.replace(/[.*+?^$()|[\]\\]/g, '\\$&')
const compile = (template) => new RegExp(`^${template.split('{id}').map(escape).join(ID)}$`)

const COMPILED = Object.fromEntries(
  Object.entries(ALLOWED_ROUTES).map(([service, methods]) => [
    service,
    Object.fromEntries(Object.entries(methods).map(([method, routes]) => [method, routes.map(compile)])),
  ]),
)

/**
 * @param {string} service administrative | inventory | analytics
 * @param {string} method HTTP method in upper case
 * @param {string} path upstream path without query string, e.g. /api/v1/items/42
 */
export function isAllowedRoute(service, method, path) {
  return COMPILED[service]?.[method]?.some((pattern) => pattern.test(path)) ?? false
}
