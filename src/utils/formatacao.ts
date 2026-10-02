const DIA_MS = 86_400_000

export function formatarData(iso: string): string {
  const data = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR')
}

export function formatarDataRelativa(iso: string, referencia: Date = new Date()): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const inicioHoje = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate())
  const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  const dias = Math.round((inicioHoje.getTime() - inicioDia.getTime()) / DIA_MS)

  if (dias === 0) return `Hoje, ${hora}`
  if (dias === 1) return `Ontem, ${hora}`
  if (data.getFullYear() === referencia.getFullYear()) {
    return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${hora}`
  }
  return data.toLocaleDateString('pt-BR')
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
