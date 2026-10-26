import { NOT_AVAILABLE } from '../../../shared/format'

export { formatRelativeTime, NOT_AVAILABLE } from '../../../shared/format'

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal = (digits: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits })

export const formatCount = (value: number): string => integer.format(value)

/** `null` is "no way to compute", not zero (BR-08): it prints a dash. */
export function formatPercent(value: number | null, digits = 1): string {
  return value === null ? NOT_AVAILABLE : `${decimal(digits).format(value)}%`
}

export function formatSignedPercent(value: number | null, digits = 1): string {
  if (value === null) return NOT_AVAILABLE
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${decimal(digits).format(Math.abs(value))}%`
}

export function formatSignedPoints(value: number | null, digits = 1): string {
  if (value === null) return NOT_AVAILABLE
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${decimal(digits).format(Math.abs(value))} p.p.`
}

/** Tonnes from one tonne up, kilograms below it, so a small impact does not read as zero. */
export function formatImpact(kg: number, tonnes: number): { value: string; detail: string } {
  return tonnes >= 1
    ? { value: `${decimal(1).format(tonnes)} t`, detail: `${decimal(0).format(kg)} kg` }
    : { value: `${decimal(1).format(kg)} kg`, detail: `${decimal(3).format(tonnes)} t` }
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** `2026-10` → `out/26`. */
export function formatMonth(month: string): string {
  const [year, number] = month.split('-')
  return `${MONTHS[Number(number) - 1] ?? month}/${year?.slice(2) ?? ''}`
}
