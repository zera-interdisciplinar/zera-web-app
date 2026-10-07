export function usePublicacao(): { paginaEstatica: boolean } {
  return { paginaEstatica: typeof document !== 'undefined' && document.location.hostname.endsWith('github.io') }
}
