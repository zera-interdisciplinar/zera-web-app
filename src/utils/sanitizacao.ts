
const TAGS = /<[^>]*>/g
const PROTOCOLOS_PERIGOSOS = /\b(javascript|data|vbscript)\s*:/gi
// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u001F\u007F]/g

export function sanitizarTexto(valor: string): string {
  return valor
    .replace(TAGS, '')
    .replace(PROTOCOLOS_PERIGOSOS, '')
    .replace(CONTROLE, ' ')
    .trim()
}

export function sanitizarObjeto<T>(valor: T): T {
  if (typeof valor === 'string') return sanitizarTexto(valor) as T
  if (Array.isArray(valor)) return valor.map((item) => sanitizarObjeto(item)) as T
  if (valor !== null && typeof valor === 'object') {
    const origem = valor as Record<string, unknown>
    const destino: Record<string, unknown> = {}
    for (const chave of Object.keys(origem)) {
      destino[chave] = sanitizarObjeto(origem[chave])
    }
    return destino as T
  }
  return valor
}
