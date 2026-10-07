import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROTULO_STATUS } from '../types/produto'
import { useAuth } from './useAuth'
import { useCategorias } from './useCategorias'
import { useMenuSuspenso } from './useMenuSuspenso'
import { useRequisicao } from './useRequisicao'
import { listarUsuarios } from '../services/usuarioService'
import type { Usuario } from '../types/usuario'

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
  opcoesResponsavel: OpcaoFiltro[]
  periodos: OpcaoFiltro[]
  status: OpcaoFiltro[]
  carregandoUsuarios: boolean
  erroUsuarios: string | null
}

interface FiltrosContexto {
  periodo: string
  categoria: string
  status: string
  responsavel: string
}

const PERIODOS = ['todo o período', 'últimos 6 meses', 'últimos 3 meses', 'último ano']
const STATUS = ['todos', ...Object.keys(ROTULO_STATUS)]

const FILTROS_PADRAO: FiltrosContexto = {
  periodo: PERIODOS[0],
  categoria: 'todas',
  status: 'todos',
  responsavel: 'todos',
}

export function useTopbar(): RetornoTopbar {
  const { usuario, sair } = useAuth()
  const navegar = useNavigate()
  const categorias = useCategorias()
  const buscarUsuarios = useCallback((sinal: AbortSignal) => listarUsuarios(sinal), [])
  const usuarios = useRequisicao<Usuario[]>(buscarUsuarios, usuario?.perfil === 'administrador')

  const [parametros] = useSearchParams()
  const filtros: FiltrosContexto = {
    periodo: parametros.get('periodo') ?? FILTROS_PADRAO.periodo,
    categoria: parametros.get('categoria') ?? FILTROS_PADRAO.categoria,
    status: parametros.get('status') ?? FILTROS_PADRAO.status,
    responsavel: parametros.get('responsavel') ?? FILTROS_PADRAO.responsavel,
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
    filtros.status !== FILTROS_PADRAO.status ||
    filtros.responsavel !== FILTROS_PADRAO.responsavel

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

  const opcoesResponsavel = [
    { valor: 'todos', rotulo: 'Todos os responsáveis' },
    ...(usuarios.dados ?? []).map((pessoa) => ({ valor: pessoa.nome, rotulo: pessoa.nome })),
  ]

  return {
    usuario, filtros, filtrosSujos, aplicar, limparFiltros, contaAberta,
    gatilhoContaRef, menuContaRef, alternarConta, aoTeclarMenuConta,
    encerrarSessao, opcoesCategoria, opcoesResponsavel,
    periodos: PERIODOS.map((periodo) => ({ valor: periodo, rotulo: periodo })),
    status: STATUS.map((status) => ({ valor: status, rotulo: ROTULO_STATUS[status as keyof typeof ROTULO_STATUS] ?? 'Todos' })),
    carregandoUsuarios: usuarios.carregando,
    erroUsuarios: usuarios.erro,
  }
}
