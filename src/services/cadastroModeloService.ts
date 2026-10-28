import { ApiError } from '../types/api'
import type { ModelResponse } from '../types/apiReal'
import type { CadastroModeloReal, MaterialCatalogo } from '../types/cadastroModelo'
import type { Modelo } from '../types/modelo'
import { validarCadastroModeloReal } from '../utils/validacaoCadastroModelo'
import { requisitarApiReal } from './apiReal'
import { contextualizar } from './http'
import { mapearModelo } from './mapeadoresApi'

export async function listarMateriais(sinal?: AbortSignal): Promise<MaterialCatalogo[]> {
  try {
    return await requisitarApiReal<MaterialCatalogo[]>('inventory', '/api/v1/materials', { sinal, unidade: true })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os materiais.')
  }
}

export async function criarModeloReal(entrada: CadastroModeloReal): Promise<Modelo> {
  try {
    const validacao = validarCadastroModeloReal(entrada)
    if (!validacao.valido) {
      const campo = Object.keys(validacao.erros)[0] as keyof CadastroModeloReal
      throw new ApiError(validacao.erros[campo] ?? 'Revise os dados do modelo.', 422, campo)
    }
    return mapearModelo(await requisitarApiReal<ModelResponse>('inventory', '/api/v1/models', {
      metodo: 'POST', corpo: validacao.dados, unidade: true,
    }))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível cadastrar o modelo.')
  }
}
