import type { SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { mensagemDeErro } from '../types/api'
import type { EstadoLocalRequisicao, EstadoRequisicao } from '../types/controles/EstadoLocalRequisicao'
export type { EstadoRequisicao } from '../types/controles/EstadoLocalRequisicao'

export function useRequisicao<T>(
  buscar: (sinal: AbortSignal) => Promise<T>,
  ativo: boolean = true,
): EstadoRequisicao<T> {
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalRequisicao<T>>(() => ({
    resultado: { dados: null, erro: null, requisicao: null },
    gatilho: 0,
  }))
  const { resultado, gatilho } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setResultado, setGatilho } = useMemo(() => ({
    setResultado: (valor: SetStateAction<EstadoLocalRequisicao<T>['resultado']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.resultado) : valor
      return Object.is(atual.resultado, proximo) ? atual : { ...atual, resultado: proximo }
    }),
    setGatilho: (valor: SetStateAction<EstadoLocalRequisicao<T>['gatilho']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.gatilho) : valor
      return Object.is(atual.gatilho, proximo) ? atual : { ...atual, gatilho: proximo }
    }),
  }), [])
  // Evita recalcular o valor enquanto suas dependências permanecem iguais.
  const requisicao = useMemo(() => ({ buscar, ativo, gatilho }), [buscar, ativo, gatilho])

  useEffect(() => {
    if (!ativo) return

    const controlador = new AbortController()
    let vivo = true

    Promise.resolve().then(() => {
      if (controlador.signal.aborted) throw new DOMException('Requisição cancelada.', 'AbortError')
      return buscar(controlador.signal)
    })
      .then((resultado) => {
        if (!vivo || controlador.signal.aborted) return
        setResultado({ dados: resultado, erro: null, requisicao })
      })
      .catch((falha: unknown) => {
        if (!vivo || controlador.signal.aborted) return
        if (falha instanceof DOMException && falha.name === 'AbortError') return
        setResultado({ dados: null, erro: mensagemDeErro(falha), requisicao })
      })

    return () => {
      vivo = false
      controlador.abort()
    }
  }, [buscar, ativo, gatilho, requisicao, setResultado])

  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const recarregar = useCallback(() => {
    setGatilho((valor) => valor + 1)
  }, [setGatilho])
  const carregando = ativo && resultado.requisicao !== requisicao

  return {
    dados: ativo && resultado.requisicao?.buscar === buscar && resultado.requisicao.ativo ? resultado.dados : null,
    carregando,
    erro: ativo && !carregando ? resultado.erro : null,
    recarregar,
  }
}
