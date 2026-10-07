export function destinoAposLogin(estado: unknown): string {
  if (!estado || typeof estado !== 'object' || !('de' in estado) || typeof estado.de !== 'string') return '/'
  const destino = estado.de
  if (!destino.startsWith('/') || destino.startsWith('//') || destino.includes('\\')) return '/'
  return destino
}
