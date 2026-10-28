const DIA_MS = 86_400_000

export function fusoDoUsuario(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
}

// Premissa: carimbos do inventário sem offset representam UTC, não hora local.
export function interpretarData(iso: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(iso) ? `${iso}Z` : iso)
}

function diaCivil(data: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(data)
}

export function formatarData(iso: string): string {
  const data = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : interpretarData(iso)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR')
}

export function formatarDataRelativa(iso: string, referencia: Date = new Date(), timeZone = fusoDoUsuario()): string {
  const data = interpretarData(iso)
  if (Number.isNaN(data.getTime())) return '—'
  const hora = data.toLocaleTimeString('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit' })
  const hoje = diaCivil(referencia, timeZone)
  const dia = diaCivil(data, timeZone)
  const dias = Math.round((Date.parse(hoje) - Date.parse(dia)) / DIA_MS)

  if (dias === 0) return `Hoje, ${hora}`
  if (dias === 1) return `Ontem, ${hora}`
  if (dia.slice(0, 4) === hoje.slice(0, 4)) {
    return `${data.toLocaleDateString('pt-BR', { timeZone, day: '2-digit', month: '2-digit' })}, ${hora}`
  }
  return data.toLocaleDateString('pt-BR', { timeZone })
}

export function diasDesde(iso: string, referencia: Date = new Date()): number {
  const data = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(data.getTime())) return 0
  return Math.max(0, Math.floor((referencia.getTime() - data.getTime()) / DIA_MS))
}

export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return quantidade === 1 ? singular : plural
}

export function montarCodigoBarras(produtoId: number, categoriaCodigo: string): string {
  return `${String(produtoId).padStart(5, '0')}-${categoriaCodigo}`
}
