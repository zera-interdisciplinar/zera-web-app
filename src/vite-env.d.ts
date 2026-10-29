
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ADMIN_API_URL?: string
  readonly VITE_INVENTORY_API_URL?: string
  readonly VITE_ADMIN_OPENAPI_URL?: string
  readonly VITE_INVENTORY_OPENAPI_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
