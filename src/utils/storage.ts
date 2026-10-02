
export const VERSAO_SCHEMA = 2

interface Envelope<T> {
  _versao: number
  dados: T
}

type Migracao<T> = (dadosAntigos: unknown) => T | null

export function salvar<T>(chave: string, dados: T): void {
  try {
    const envelope: Envelope<T> = { _versao: VERSAO_SCHEMA, dados }
    window.localStorage.setItem(chave, JSON.stringify(envelope))
  } catch {
    return
  }
}

export function carregar<T>(chave: string, migracoes: Record<number, Migracao<T>> = {}): T | null {
  try {
    const bruto = window.localStorage.getItem(chave)
    if (!bruto) return null

    const envelope = JSON.parse(bruto) as Partial<Envelope<unknown>>
    if (typeof envelope !== 'object' || envelope === null || typeof envelope._versao !== 'number') {
      window.localStorage.removeItem(chave)
      return null
    }

    if (envelope._versao === VERSAO_SCHEMA) return envelope.dados as T

    const migracao = migracoes[envelope._versao]
    if (migracao) {
      const migrado = migracao(envelope.dados)
      if (migrado !== null) {
        salvar(chave, migrado)
        return migrado
      }
    }

    window.localStorage.removeItem(chave)
    return null
  } catch {
    return null
  }
}

export function remover(chave: string): void {
  try {
    window.localStorage.removeItem(chave)
  } catch {
    return
  }
}

export const CHAVE_SESSAO = 'zera.sessao'
export const CHAVE_PREFERENCIAS_INVENTARIO = 'zera.inventario.preferencias'
