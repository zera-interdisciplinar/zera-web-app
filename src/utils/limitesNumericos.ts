export interface FaixaNumerica { min: number; max: number; step: number; dica: string }
// Máximos sem restrição publicada são limites de usabilidade, não regras do servidor.
export const LIMITES = {
  meses: { min: 1, max: 600, step: 1, dica: '1 a 600 meses' },
  dias: { min: 7, max: 365, step: 1, dica: '7 a 365 dias' },
  percentual: { min: 1, max: 100, step: 1, dica: '1 a 100%' },
  peso: { min: 0.001, max: 100000, step: 0.001, dica: '0,001 a 100.000 kg' },
  quantidade: { min: 1, max: 2147483647, step: 1, dica: '1 a 2.147.483.647' },
} satisfies Record<string, FaixaNumerica>

export function faixaDoCampo(id: string): FaixaNumerica {
  if (/vida-util|garantia/.test(id)) return LIMITES.meses
  if (/peso/.test(id)) return LIMITES.peso
  if (/dias|lote-critico/.test(id)) return LIMITES.dias
  if (/meta|circularidade/.test(id)) return LIMITES.percentual
  return LIMITES.quantidade
}

export function limitarNumero(texto: string, faixa: FaixaNumerica): string | null {
  if (texto === '') return ''
  const padrao = faixa.step === 1 ? /^\d+$/ : /^\d+(?:[.,]\d*)?$/
  if (!padrao.test(texto)) return null
  const normalizado = texto.replace(',', '.')
  const valor = Number(normalizado)
  return valor > faixa.max ? String(faixa.max) : normalizado
}
