import { describe, expect, it } from 'vitest'
import { escolherVozLocal, separarTextoParaLeitura } from '../src/services/leituraService'

function voz(lang: string, localService: boolean): SpeechSynthesisVoice {
  return { lang, localService, default: false, name: lang, voiceURI: lang }
}

describe('leitura em voz alta e privacidade', () => {
  it('não perde palavras ao dividir conteúdo longo', () => {
    const texto = Array.from({ length: 400 }, (_, i) => `palavra${i}`).join(' ')
    const trechos = separarTextoParaLeitura(texto)
    expect(trechos.length).toBeGreaterThan(1)
    expect(trechos.join(' ')).toBe(texto)
    expect(trechos.every((trecho) => trecho.length <= 500)).toBe(true)
  })
  it('ignora conteúdo vazio', () => {
    expect(separarTextoParaLeitura(' \n ')).toEqual([])
  })
  it('prioriza português brasileiro local', () => {
    const brasileira = voz('pt-BR', true)
    expect(escolherVozLocal([voz('pt-PT', true), voz('pt-BR', false), brasileira])).toBe(brasileira)
  })
  it('não envia texto a uma voz remota nem escolhe idioma incompatível', () => {
    expect(escolherVozLocal([voz('pt-BR', false), voz('en-US', true)])).toBeUndefined()
  })
})
