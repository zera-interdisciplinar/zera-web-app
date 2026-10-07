import { RotateCcw } from 'lucide-react'
import { ROTULO_STATUS } from '../../types/produto'
import type { StatusItem } from '../../types/produto'
import { useTopbar } from '../../hooks/useTopbar'
import { iniciais, ROTULO_PERFIL } from '../../types/usuario'
import { FilterChip } from '../FilterChip'
import estilos from '../../../styles/components/Topbar/Topbar.module.css'

export function Topbar() {
  const {
    usuario, filtros, filtrosSujos, aplicar, limparFiltros, contaAberta,
    gatilhoContaRef, menuContaRef, alternarConta, aoTeclarMenuConta,
    encerrarSessao, opcoesCategoria, opcoesResponsavel, periodos, status,
  } = useTopbar()

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
          opcoes={periodos}
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
          opcoes={status}
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
