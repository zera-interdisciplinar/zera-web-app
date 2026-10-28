import { expect, it } from 'vitest'
import { ApiError, mensagemDeErro } from '../src/types/api'

it.each(['BFF indisponível', 'Não existe endpoint', 'Falta contrato', 'payload inválido', 'API de inventário indisponível', 'Falha no analytics'])(
  'não expõe diagnóstico técnico: %s', (texto) => {
    for (const erro of [new Error(texto), new ApiError(texto, 0)]) {
      expect(mensagemDeErro(erro)).toBe('Não conseguimos carregar agora. Tente de novo em instantes.')
    }
  },
)
