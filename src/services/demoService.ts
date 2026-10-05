import digestEsperado from 'virtual:credencial-demo'

export async function validarCredencialDemo(senha: string): Promise<boolean> {
  if (!digestEsperado) return false
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha))
  const recebido = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return recebido === digestEsperado
}
