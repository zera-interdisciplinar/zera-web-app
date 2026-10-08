import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Modelo } from '../types/modelo'
import { normalizarBusca } from '../utils/busca'
import { useCadastroModelo } from './useCadastroModelo'
import { useCategorias } from './useCategorias'


export function useListaModelos() {
  const categorias = useCategorias()
  const [parametros, setParametros] = useSearchParams()
  const busca = parametros.get('q') ?? ''

  function setBusca(valor: string) { setParametros(valor ? { q: valor } : {}, { replace: true }) }
  const cadastro = useCadastroModelo()
  const { modelos, permitido, modoDemonstracao, toast, abrir, alterar } = cadastro

  // Filtra novamente apenas quando os dados ou o termo de busca mudam.
  const visiveis = useMemo<Modelo[]>(() => {
    const dados = modelos.dados ?? []
    const termo = normalizarBusca(busca)
    if (termo.length === 0) return dados
    return dados.filter(
      (modelo) =>
        normalizarBusca(modelo.nome).includes(termo) ||
        normalizarBusca(modelo.fabricante).includes(termo) ||
        normalizarBusca(modelo.categoriaNome ?? '').includes(termo),
    )
  }, [modelos.dados, busca])
  return { categorias, busca, setBusca, cadastro, modelos, permitido, modoDemonstracao, toast, abrir, alterar, visiveis }
}
