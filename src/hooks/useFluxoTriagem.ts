import { useReducer } from 'react'
import {
ITENS_CHECKLIST,
estadoInicialTriagem,
triagemReducer,
} from '../reducers/triagemReducer'
import { registrarTriagem } from '../services/produtoService'
import { mensagemDeErro } from '../types/api'
import { useAuth } from './useAuth'
import { useCategorias } from './useCategorias'
import { useProduto } from './useProduto'

export function useFluxoTriagem({ produtoId }: { produtoId: number }) {
  const { usuario } = useAuth()
  const produto = useProduto(produtoId)
  const categorias = useCategorias()
  const [estado, despachar] = useReducer(triagemReducer, estadoInicialTriagem)
  const categoria = categorias.dados?.find((item) => item.id === produto.dados?.categoriaId)
  const exigeChecklist = categoria?.exigeChecklistPericulosidade ?? false

  async function aoConcluir() {
    if (!estado.classificacao) return

    despachar({ tipo: 'envio-iniciado' })
    try {
      await registrarTriagem({
        produtoId,
        classificacao: estado.classificacao,
        checklistPericulosidade: ITENS_CHECKLIST.filter((item) => estado.checklist[item]),
        responsavel: usuario?.nome ?? 'operador não identificado',
      })
      despachar({ tipo: 'envio-concluido' })
    } catch (falha) {
      despachar({ tipo: 'envio-falhou', mensagem: mensagemDeErro(falha) })
    }
  }
  return { usuario, produto, categorias, estado, despachar, exigeChecklist, aoConcluir }
}
