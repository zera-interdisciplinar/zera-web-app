import { useCallback, useState } from 'react'
import { obterConfiguracoes, salvarConfiguracoes } from '../services/configuracaoService'
import { mensagemDeErro } from '../types/api'
import type { Configuracoes } from '../types/configuracao'
import type { ErrosDeCampo } from '../utils/validacao'
import { validarConfiguracoes } from '../utils/validacao'
import { usePermissoes } from './usePermissoes'
import { useRequisicao } from './useRequisicao'
import { useToast } from './useToast'

interface EstadoFormulario {
  diasLoteCritico: string | null
  erros: ErrosDeCampo<Configuracoes>
  salvando: boolean
  erroEnvio: string | null
}

export function useConfiguracoes() {
  const permissoes = usePermissoes()

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback((sinal: AbortSignal) => obterConfiguracoes(sinal), [])
  const configuracoes = useRequisicao<Configuracoes>(buscar, permissoes.consultarConfiguracoes)
  const [toast, mostrarToast] = useToast()
  const [estado, setEstado] = useState<EstadoFormulario>({ diasLoteCritico: null, erros: {}, salvando: false, erroEnvio: null })
  const diasLoteCritico = estado.diasLoteCritico ?? String(configuracoes.dados?.diasLoteCritico ?? '')

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!permissoes.consultarConfiguracoes || estado.salvando) return
    const validacao = validarConfiguracoes({ diasLoteCritico: Number(diasLoteCritico) })
    setEstado((atual) => ({ ...atual, erros: validacao.erros, erroEnvio: null }))
    if (!validacao.valido) return
    setEstado((atual) => ({ ...atual, salvando: true }))
    try {
      await salvarConfiguracoes(validacao.dados)
      mostrarToast('Prazo para lote crítico atualizado.')
    } catch (falha: unknown) {
      setEstado((atual) => ({ ...atual, erroEnvio: mensagemDeErro(falha) }))
    } finally {
      setEstado((atual) => ({ ...atual, salvando: false }))
    }
  }
  return { permissoes, configuracoes, toast, estado, setEstado, diasLoteCritico, aoSalvar }
}
