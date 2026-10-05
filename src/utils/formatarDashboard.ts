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
  if (status === 403) return 'Seu perfil não tem acesso a este painel.'
  if (import.meta.env.DEV) console.warn('[Zera] Falha no painel', { status, resposta: Boolean(detalhe) })
  return 'Não conseguimos carregar agora. Tente de novo em instantes.'
}
