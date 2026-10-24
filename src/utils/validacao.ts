export type ErrosDeCampo<T> = Partial<Record<keyof T, string>>

export interface ResultadoValidacao<T> {
  valido: boolean
  erros: ErrosDeCampo<T>
  dados: T
}
