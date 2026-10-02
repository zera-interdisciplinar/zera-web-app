import { useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROTULO_STATUS } from '../../types/produto'
import type { StatusItem } from '../../types/produto'
import { useAuth } from '../../hooks/useAuth'
import { useCategorias } from '../../hooks/useCategorias'
import { useMenuSuspenso } from '../../hooks/useMenuSuspenso'
import { useRequisicao } from '../../hooks/useRequisicao'
import { listarUsuarios } from '../../services/usuarioService'
import type { Usuario } from '../../types/usuario'
import { iniciais, ROTULO_PERFIL } from '../../types/usuario'
import { FilterChip } from '../FilterChip'
import estilos from './Topbar.module.css'

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

export function Topbar() {
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

  return (
    <div className={estilos.topbar}>
      <div className={estilos.filtros} role="group" aria-label="Filtros de contexto">
        <FilterChip
          aparencia="texto"
          rotulo={
            <>
              Período: <strong>{filtros.periodo}</strong>
            </>
          }
          opcoes={PERIODOS.map((periodo) => ({ valor: periodo, rotulo: periodo }))}
          valorAtual={filtros.periodo}
          aoSelecionar={(valor) => aplicar('periodo', valor)}
        />
        <span className={estilos.separador} aria-hidden="true">
          •
        </span>
        <FilterChip
          aparencia="texto"
          rotulo={
            <>
              Categoria: <strong>{opcoesCategoria.find((opcao) => opcao.valor === filtros.categoria)?.rotulo ?? 'Todas as categorias'}</strong>
            </>
          }
          opcoes={opcoesCategoria}
          valorAtual={filtros.categoria}
          aoSelecionar={(valor) => aplicar('categoria', valor)}
        />
        <span className={estilos.separador} aria-hidden="true">
          •
        </span>
        <FilterChip
          aparencia="texto"
          rotulo={
            <>
              Status: <strong>{ROTULO_STATUS[filtros.status as StatusItem] ?? 'Todos'}</strong>
            </>
          }
          opcoes={STATUS.map((status) => ({ valor: status, rotulo: ROTULO_STATUS[status as StatusItem] ?? 'Todos' }))}
          valorAtual={filtros.status}
          aoSelecionar={(valor) => aplicar('status', valor)}
        />
        <span className={estilos.separador} aria-hidden="true">
          •
        </span>
        {usuario?.perfil === 'administrador' && <FilterChip aparencia="texto" rotulo={<>Responsável: <strong>{filtros.responsavel}</strong></>} opcoes={opcoesResponsavel} valorAtual={filtros.responsavel} aoSelecionar={(valor) => aplicar('responsavel', valor)} />}
        {filtrosSujos && (
          <button type="button" className={estilos.limpar} onClick={limparFiltros}>
            <RotateCcw size={14} aria-hidden="true" />
            Limpar filtros
          </button>
        )}
      </div>

      {usuario && (
        <div className={estilos.conta}>
          <button
            type="button"
            className={estilos.avatar}
            aria-label={`Conta de ${usuario.nome}`}
            aria-haspopup="menu"
            aria-expanded={contaAberta}
            aria-controls={contaAberta ? 'menu-conta' : undefined}
            ref={gatilhoContaRef}
            onClick={alternarConta}
          >
            {iniciais(usuario.nome)}
          </button>

          {contaAberta && (
            <ul
              className={estilos.menuConta}
              id="menu-conta"
              role="menu"
              ref={menuContaRef}
              onKeyDown={aoTeclarMenuConta}
            >
              <li role="none" className={estilos.menuInfo}>
                <span className={estilos.menuAvatar} aria-hidden="true">
                  {iniciais(usuario.nome)}
                </span>
                <span className={estilos.menuIdentidade}>
                  <span className={estilos.menuNome}>{usuario.nome}</span>
                  <span className={estilos.menuCargo}>
                    {(usuario.cargo ?? ROTULO_PERFIL[usuario.perfil])} · {usuario.unidade}
                  </span>
                  <span className={estilos.menuEmail}>{usuario.email}</span>
                </span>
              </li>
              <li role="none">
                <button type="button" role="menuitem" className={estilos.menuAcao} onClick={encerrarSessao}>
                  Encerrar sessão
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
