import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROTULO_STATUS } from '../types/produto'
import { useAuth } from './useAuth'
import { useCategorias } from './useCategorias'
import { useMenuSuspenso } from './useMenuSuspenso'

interface OpcaoFiltro { valor: string; rotulo: string }

interface RetornoTopbar {
  usuario: ReturnType<typeof useAuth>['usuario']
  filtros: FiltrosContexto
  filtrosSujos: boolean
  aplicar: (chave: keyof FiltrosContexto, valor: string) => void
  limparFiltros: () => void
  contaAberta: boolean
  gatilhoContaRef: ReturnType<typeof useMenuSuspenso>['gatilhoRef']
  menuContaRef: ReturnType<typeof useMenuSuspenso>['menuRef']
  alternarConta: () => void
  aoTeclarMenuConta: ReturnType<typeof useMenuSuspenso>['aoTeclarMenu']
  encerrarSessao: () => void
  opcoesCategoria: OpcaoFiltro[]
  periodos: OpcaoFiltro[]
  status: OpcaoFiltro[]
}

interface FiltrosContexto {
  periodo: string
  categoria: string
  status: string
}

const PERIODOS = ['todo o período', 'últimos 6 meses', 'últimos 3 meses', 'último ano']
const STATUS = ['todos', ...Object.keys(ROTULO_STATUS)]

const FILTROS_PADRAO: FiltrosContexto = {
  periodo: PERIODOS[0],
  categoria: 'todas',
  status: 'todos',
}

export function useTopbar(): RetornoTopbar {
  const { usuario, sair } = useAuth()
  const navegar = useNavigate()
  const categorias = useCategorias()
  const [parametros] = useSearchParams()
  const filtros: FiltrosContexto = {
    periodo: parametros.get('periodo') ?? FILTROS_PADRAO.periodo,
    categoria: parametros.get('categoria') ?? FILTROS_PADRAO.categoria,
    status: parametros.get('status') ?? FILTROS_PADRAO.status,
  }
  function aplicar(chave: keyof FiltrosContexto, valor: string) {
    const novos = new URLSearchParams(parametros)
    if (valor === FILTROS_PADRAO[chave]) novos.delete(chave)
    else novos.set(chave, valor)
    navegar(`/itens?${novos}`)
  }
  const filtrosSujos =
    filtros.periodo !== FILTROS_PADRAO.periodo ||
    filtros.categoria !== FILTROS_PADRAO.categoria ||
    filtros.status !== FILTROS_PADRAO.status
  const limparFiltros = () => navegar('/itens')
  const {
    aberto: contaAberta,
    gatilhoRef: gatilhoContaRef,
    menuRef: menuContaRef,
    alternar: alternarConta,
    fechar: fecharConta,
    aoTeclarMenu: aoTeclarMenuConta,
  } = useMenuSuspenso()

  function encerrarSessao() {
    fecharConta()
    sair()
    navegar('/login')
  }
  const opcoesCategoria = [
    { valor: 'todas', rotulo: 'Todas as categorias' },
    ...(categorias.dados ?? []).map((categoria) => ({
      valor: String(categoria.id),
      rotulo: categoria.nome,
    })),
  ]

  return {
    usuario, filtros, filtrosSujos, aplicar, limparFiltros, contaAberta,
    gatilhoContaRef, menuContaRef, alternarConta, aoTeclarMenuConta,
    encerrarSessao, opcoesCategoria,
    periodos: PERIODOS.map((periodo) => ({ valor: periodo, rotulo: periodo })),
    status: STATUS.map((status) => ({ valor: status, rotulo: ROTULO_STATUS[status as keyof typeof ROTULO_STATUS] ?? 'Todos' })),
  }
}
