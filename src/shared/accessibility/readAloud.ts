const CHUNK_LIMIT = 500
const SKIPPED = 'form, input, textarea, select, script, style, svg, [hidden], [inert], [aria-hidden="true"], [data-sensitive], .somente-leitor-de-tela'

/** Splits long text at word boundaries so the speech engine never receives more than 500 characters at once. */
export function splitForSpeech(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let chunk = ''
  for (const word of words) {
    if (chunk && chunk.length + word.length + 1 > CHUNK_LIMIT) {
      chunks.push(chunk)
      chunk = ''
    }
    chunk += `${chunk ? ' ' : ''}${word}`
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

/** Visible text of an element, skipping forms, charts and anything hidden from assistive technology. */
export function visibleText(container: HTMLElement): string {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const parts: string[] = []
  while (walker.nextNode()) {
    const element = walker.currentNode.parentElement
    if (!element || element.closest(SKIPPED)) continue
    if (element.getClientRects().length === 0 || getComputedStyle(element).visibility !== 'visible') continue
    const text = walker.currentNode.textContent?.trim()
    if (text) parts.push(text)
  }
  return parts.join(' ')
}

/** What to read: the selected text when there is one, otherwise the main content (A-9). */
export function textToRead(): string {
  const selection = window.getSelection()?.toString().trim()
  if (selection) return selection
  const main = document.querySelector<HTMLElement>('main')
  return main ? visibleText(main) : ''
}

/** Only local voices: text never leaves the device. */
export function pickLocalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return voices.find((voice) => voice.localService && /^pt[-_]BR$/i.test(voice.lang))
    ?? voices.find((voice) => voice.localService && /^pt(?:[-_]|$)/i.test(voice.lang))
}
