import { ApiError } from '../types/api'
import { lerLista } from '../utils/guardasApi'
import { ehMaterialApi, ehModeloApi } from '../utils/guardaModeloApi'
import type { CadastroModeloReal, MaterialCatalogo } from '../types/cadastroModelo'
import type { Modelo } from '../types/modelo'
import { validarCadastroModeloReal } from '../utils/validacaoCadastroModelo'
import { requisitarApiReal } from './apiReal'
import { contextualizar } from './http'
import { mapearModelo } from './mapeadoresApi'

export async function listarMateriais(sinal?: AbortSignal): Promise<MaterialCatalogo[]> {
  try {
    return lerLista(await requisitarApiReal<unknown>('inventory', '/api/v1/materials', { sinal, unidade: true }), ehMaterialApi)
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
    const resposta = await requisitarApiReal<unknown>('inventory', '/api/v1/models', {
      metodo: 'POST', corpo: validacao.dados, unidade: true,
    })
    if (!ehModeloApi(resposta)) throw new ApiError('Não conseguimos confirmar o modelo recebido. Tente novamente.', 0)
    const aprovacao = ['APPROVED', 'PENDING_APPROVAL', 'PENDING', 'REJECTED'].includes(resposta.approvalStatus) ? resposta.approvalStatus : 'Não informado'
    return mapearModelo({ ...resposta, approvalStatus: aprovacao })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível cadastrar o modelo.')
  }
}
