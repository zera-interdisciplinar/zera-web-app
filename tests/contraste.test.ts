import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

function cor(nome: string): string {
  const encontrada = css.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`))
  if (!encontrada) throw new Error(`Token de cor ausente: ${nome}`)
  return encontrada[1]
}

function luminancia(hexa: string): number {
  const canais = [1, 3, 5].map((indice) => parseInt(hexa.slice(indice, indice + 2), 16) / 255)
  const linear = canais.map((canal) => canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4)
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function razao(primeira: string, segunda: string): number {
  const valores = [luminancia(cor(primeira)), luminancia(cor(segunda))].sort((a, b) => b - a)
  return (valores[0] + 0.05) / (valores[1] + 0.05)
}

describe('contraste dos tokens aplicados a textos e controles', () => {
  it.each([
    ['texto', 'branco'],
    ['texto', 'fundo'],
    ['texto-secundario', 'branco'],
    ['texto-secundario', 'fundo'],
    ['azul', 'branco'],
    ['ambar-texto', 'branco'],
    ['ambar-texto', 'fundo'],
    ['verde-texto', 'branco'],
    ['verde-texto', 'fundo'],
    ['perigo', 'branco'],
    ['branco', 'navy'],
    ['navy', 'ambar'],
    ['navy', 'ambar-hover'],
    ['branco', 'navy-suave'],
    ['branco', 'verde-texto'],
  ])('%s sobre %s alcança 4,5:1', (frente, fundo) => {
    expect(razao(frente, fundo)).toBeGreaterThanOrEqual(4.5)
  })

  it('contorno navy sobre branco alcança 3:1', () => {
    expect(razao('navy', 'branco')).toBeGreaterThanOrEqual(3)
  })
  it.each(['branco', 'fundo'])('borda de controle sobre %s alcança 3:1', (fundo) => {
    expect(razao('borda-controle', fundo)).toBeGreaterThanOrEqual(3)
  })
  it('arco do gráfico sobre o trilho alcança 3:1', () => {
    expect(razao('verde-texto', 'azul-claro')).toBeGreaterThanOrEqual(3)
  })
})
