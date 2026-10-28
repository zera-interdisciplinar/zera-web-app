export function formatarNumero(valor: number | null | undefined, casas = 0): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(valor)
}

export function formatarVariacao(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—'
  const prefixo = valor > 0 ? '+' : ''
  return `${prefixo}${formatarNumero(valor, 2)}% em relação à janela anterior`
}

export function formatarPontosPercentuais(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—'
  const prefixo = valor > 0 ? '+' : ''
  return `${prefixo}${formatarNumero(valor, 2)} p.p.`
}

export function formatarErroDashboard(status: number, detalhe: string): string {
  if (status === 401) return 'Sua sessão expirou. Entre novamente para continuar.'
  if (status === 403) return 'Seu perfil não tem acesso ao painel de analytics.'
  if (status === 0) return detalhe
  return `HTTP ${status || '—'}: ${detalhe}`
}
