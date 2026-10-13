export function formatarNumero(valor: number | null | undefined, casas = 0): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(valor)
}

export function formatarVariacao(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 'Sem comparação disponível'
  const prefixo = valor > 0 ? '+' : ''
  return `${prefixo}${formatarNumero(valor, 2)}% em relação à janela anterior`
}

export function formatarPontosPercentuais(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 'variação indisponível'
  const prefixo = valor > 0 ? '+' : ''
  return `${prefixo}${formatarNumero(valor, 2)} p.p.`
}
