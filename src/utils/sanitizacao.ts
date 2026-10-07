
const TAGS = /<[^>]*>/g
const PROTOCOLOS_PERIGOSOS = /\b(javascript|data|vbscript)\s*:/gi

export function sanitizarTexto(valor: string): string {
  const texto = Array.from(valor, (caractere) => {
    const codigo = caractere.charCodeAt(0)
    return codigo < 32 || codigo === 127 ? ' ' : caractere
  }).join('')
  return texto
    .replace(TAGS, '')
    .replace(PROTOCOLOS_PERIGOSOS, '')
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
