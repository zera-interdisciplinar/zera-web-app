import { ApiError } from '../types/api'
import { lerItemApi } from '../utils/guardaItemApi'
import type { CadastroItemEntrada, CadastroItemReal } from '../types/cadastroItem'
import type { ProdutoDetalhado } from '../types/produto'
import { validarCadastroItemReal } from '../utils/validacaoItemReal'
import { requisitarApiReal } from './apiReal'
import { contextualizar } from './http'
import { mapearItem } from './mapeadoresApi'

export async function criarItemReal(entrada: CadastroItemEntrada): Promise<ProdutoDetalhado> {
  try {
    const validacao = validarCadastroItemReal(entrada)
    if (!validacao.valido) {
      const campo = Object.keys(validacao.erros)[0] as keyof CadastroItemReal
      throw new ApiError(validacao.erros[campo] ?? 'Revise os dados do item.', 422, campo)
    }
    const item = await requisitarApiReal<unknown>('inventory', '/api/v1/items', {
      metodo: 'POST', corpo: validacao.dados, unidade: true,
    })
    return mapearItem(lerItemApi(item))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível cadastrar o item.')
  }
}

export async function removerItemReal(id: number | string): Promise<void> {
  try {
    const resposta = await requisitarApiReal<unknown>('inventory', `/api/v1/items/${encodeURIComponent(id)}`, {
      metodo: 'DELETE', unidade: true,
    })
    if (resposta !== undefined) throw new ApiError('Não conseguimos confirmar a remoção do item. Atualize a lista antes de tentar novamente.', 0)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível remover o item.')
  }
}
