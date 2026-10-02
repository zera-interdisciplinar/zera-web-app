/// <reference types="vite/client" />

declare module 'virtual:credencial-demo' {
  const digest: string
  export default digest
}

interface ImportMetaEnv {
  readonly VITE_ROUTER_MODE?: 'hash' | 'history'
  readonly VITE_USE_MSW?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ADMIN_API_URL?: string
  readonly VITE_INVENTORY_API_URL?: string
  readonly VITE_ADMIN_OPENAPI_URL?: string
  readonly VITE_INVENTORY_OPENAPI_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
