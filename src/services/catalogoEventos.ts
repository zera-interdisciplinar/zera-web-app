// Invalidação sem persistência: todas as telas abertas consultam novamente a fonte.
const observadores = new Set<() => void>()
export function invalidarCatalogo() { observadores.forEach((observar) => observar()) }
export function observarCatalogo(observar: () => void) {
  observadores.add(observar)
  return () => { observadores.delete(observar) }
}
