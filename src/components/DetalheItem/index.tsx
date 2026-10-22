import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import estilos from '../../../styles/pages/ItemDetalhePage/ItemDetalhePage.module.css'
import { useDetalheItem } from '../../hooks/useDetalheItem'
import type { DetalheItemProps } from '../../types/componentes/DetalheItem'
import { ROTULO_CONDICAO } from '../../types/produto'
import { rotuloEvento } from '../../utils/eventos'
import { formatarData, formatarDataRelativa } from '../../utils/formatacao'
import { EdicaoItemReal } from '../EdicaoItemReal'
import { EstadoErro } from '../EstadoErro'
import { FluxoItemReal } from '../FluxoItemReal'
import { Skeleton } from '../Skeleton'
import { StatusText } from '../StatusText'
import { Tabs } from '../Tabs'

const ABAS = [
  { id: 'dados', rotulo: 'Dados' },
  { id: 'eventos', rotulo: 'Eventos' },
]

export function DetalheItem({ produtoId }: DetalheItemProps) {
  const { temPerfil, produto, eventos, abaAtiva, setAbaAtiva, tituloRef } = useDetalheItem({ produtoId })

  if (produto.carregando && !produto.dados) {
    return <Skeleton descricao="Carregando os dados do item." linhas={5} />
  }

  if (produto.erro) {
    return <><h1 className="titulo-pagina">Detalhes do item</h1><EstadoErro mensagem={produto.erro} aoTentarNovamente={produto.recarregar} /></>
  }
  const item = produto.dados

  if (!item) return null

  return (
    <>
      <nav className={estilos.trilha} aria-label="Trilha de navegação">
        <Link to="/itens" className={estilos.voltar}>
          <ArrowLeft size={16} aria-hidden="true" /> Itens
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{item.nome}</span>
      </nav>

      <header className={estilos.cabecalho}>
        <div>
          <h1 className="titulo-pagina" tabIndex={-1} ref={tituloRef}>
            {item.nome}
          </h1>
        </div>
        <div className={estilos.cabecalhoDireita}>
          <StatusText status={item.status} />
          <EdicaoItemReal item={item} aoConcluir={produto.recarregar} />
          <FluxoItemReal item={item} aoConcluir={produto.recarregar} />
        </div>
      </header>

      <section className={estilos.cartao}>
        <Tabs abas={ABAS} ativa={abaAtiva} aoSelecionar={setAbaAtiva} rotuloLista="Seções do detalhe do item" />

        {abaAtiva === 'eventos' && <div id="painel-eventos" role="tabpanel" aria-labelledby="aba-eventos" tabIndex={0} className={estilos.painel}>
          <h2>Histórico de eventos</h2>
          {eventos.carregando && <Skeleton descricao="Carregando eventos do item." linhas={3} />}
          {eventos.erro && <EstadoErro mensagem={eventos.erro} aoTentarNovamente={eventos.recarregar} />}
          {eventos.dados && <p role="status">{eventos.dados.length} eventos encontrados.</p>}
          <ul>{eventos.dados?.map((evento) => <li key={evento.id}><time dateTime={evento.occurredAt}>{formatarDataRelativa(evento.occurredAt)}</time> — {rotuloEvento(evento)}{temPerfil(['gestor']) && ` — ${evento.actorName ?? 'Responsável não informado'}`}{evento.reason && `: ${evento.reason}`}</li>)}</ul>
        </div>}

        {abaAtiva === 'dados' && (
          <div id="painel-dados" role="tabpanel" aria-labelledby="aba-dados" className={estilos.painel}>
            <dl className={estilos.gradeDados}>
              <div>
                <dt>Categoria</dt>
                <dd>{item.categoriaNome}</dd>
              </div>
              <div>
                <dt>Marca</dt>
                <dd>{item.marca}</dd>
              </div>
              <div>
                <dt>Condição</dt>
                <dd>{ROTULO_CONDICAO[item.condicao]}</dd>
              </div>
              <div>
                <dt>Cadastro</dt>
                <dd>
                  {formatarData(item.dataEntrada)} ({item.diasEmEstoque} dias)
                </dd>
              </div>
              {temPerfil(['gestor']) && <div>
                <dt>Cadastrado por</dt>
                <dd>{item.responsavel}</dd>
              </div>}
              <div>
                <dt>Última atualização</dt>
                <dd>{formatarDataRelativa(item.atualizacao)}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </>
  )
}
