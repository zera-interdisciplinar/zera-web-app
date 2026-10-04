export function separarTextoParaLeitura(texto: string): string[] {
  const palavras = texto.trim().split(/\s+/).filter(Boolean)
  const trechos: string[] = []
  let trecho = ''
  for (const palavra of palavras) {
    if (trecho && trecho.length + palavra.length + 1 > 500) {
      trechos.push(trecho)
      trecho = ''
    }
    trecho += `${trecho ? ' ' : ''}${palavra}`
  }
  if (trecho) trechos.push(trecho)
  return trechos
}

export function obterTextoVisivel(conteudo: HTMLElement): string {
  const leitor = document.createTreeWalker(conteudo, NodeFilter.SHOW_TEXT)
  const partes: string[] = []
  while (leitor.nextNode()) {
    const elemento = leitor.currentNode.parentElement
    if (!elemento || elemento.closest('form, input, textarea, select, script, style, svg, [hidden], [inert], [aria-hidden="true"], [data-sensivel], .somente-leitor-de-tela')) continue
    const estilo = getComputedStyle(elemento)
    if (elemento.getClientRects().length === 0 || estilo.visibility !== 'visible') continue
    const texto = leitor.currentNode.textContent?.trim()
    if (texto) partes.push(texto)
  }
  return partes.join(' ')
}

export function escolherVozLocal(vozes: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return vozes.find((voz) => voz.localService && /^pt[-_]BR$/i.test(voz.lang))
    ?? vozes.find((voz) => voz.localService && /^pt(?:[-_]|$)/i.test(voz.lang))
}
