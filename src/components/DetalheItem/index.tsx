import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import estilos from '../../../styles/pages/ItemDetalhePage/ItemDetalhePage.module.css'
import { useAmbiente } from '../../hooks/useAmbiente'
import { useDetalheItem } from '../../hooks/useDetalheItem'
import type { DetalheItemProps } from '../../types/componentes/DetalheItem'
import type { RiscoFalha, TipoManutencao } from '../../types/manutencao'
import { ROTULO_CONDICAO } from '../../types/produto'
import { rotuloEvento } from '../../utils/eventos'
import { formatarData, formatarDataRelativa } from '../../utils/formatacao'
import { Button } from '../Button'
import { EdicaoItemReal } from '../EdicaoItemReal'
import { EstadoErro } from '../EstadoErro'
import { FieldCard } from '../FieldCard'
import { FluxoItemReal } from '../FluxoItemReal'
import { Formulario } from '../Formulario'
import { Skeleton } from '../Skeleton'
import { StatusText } from '../StatusText'
import { Tabs } from '../Tabs'
const ROTULO_RISCO: Record<RiscoFalha, string> = {
  baixo: 'risco baixo',
  medio: 'risco médio',
  alto: 'risco alto',
}
const ABAS = [
  { id: 'dados', rotulo: 'Dados' },
  { id: 'manutencoes', rotulo: 'Manutenções' },
  { id: 'ciclo', rotulo: 'Ciclo de vida' },
]

export function DetalheItem({ produtoId }: DetalheItemProps) {
  const { modoDemonstracao } = useAmbiente()
  const {
    temPerfil,
    navegar,
    produto,
    eventos,
    manutencoes,
    analise,
    abaAtiva,
    setAbaAtiva,
    form,
    setForm,
    erroForm,
    enviando,
    sucesso,
    tituloRef,
    aoRegistrarManutencao,
  } = useDetalheItem({ produtoId })

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
          {!modoDemonstracao && <EdicaoItemReal item={item} aoConcluir={produto.recarregar} />}
          {!modoDemonstracao && <FluxoItemReal item={item} aoConcluir={produto.recarregar} />}
          {modoDemonstracao && temPerfil(['funcionario', 'administrador']) && <Button variante="primario" onClick={() => navegar(`/itens/${item.id}/triagem`)}>
            Iniciar triagem
          </Button>}
        </div>
      </header>

      <section className={estilos.cartao}>
        <Tabs
          abas={modoDemonstracao ? ABAS.filter((aba) => aba.id !== 'ciclo' || temPerfil(['gestor', 'administrador'])) : [ABAS[0], { id: 'eventos', rotulo: 'Eventos' }]}
          ativa={abaAtiva}
          aoSelecionar={setAbaAtiva}
          rotuloLista="Seções do detalhe do item"
        />

        {abaAtiva === 'eventos' && <div id="painel-eventos" role="tabpanel" aria-labelledby="aba-eventos" tabIndex={0} className={estilos.painel}>
          <h2>Histórico de eventos</h2>
          {eventos.carregando && <Skeleton descricao="Carregando eventos do item." linhas={3} />}
          {eventos.erro && <EstadoErro mensagem={eventos.erro} aoTentarNovamente={eventos.recarregar} />}
          {eventos.dados && <p role="status">{eventos.dados.length} eventos encontrados.</p>}
          <ul>{eventos.dados?.map((evento) => <li key={evento.id}><time dateTime={evento.occurredAt}>{formatarDataRelativa(evento.occurredAt)}</time> — {rotuloEvento(evento)}{temPerfil(['gestor', 'administrador']) && ` — ${evento.actorName ?? 'Responsável não informado'}`}{evento.reason && `: ${evento.reason}`}</li>)}</ul>
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
                <dt>{modoDemonstracao ? 'Entrada no estoque' : 'Cadastro'}</dt>
                <dd>
                  {formatarData(item.dataEntrada)} ({item.diasEmEstoque} dias)
                </dd>
              </div>
              {temPerfil(['gestor', 'administrador']) && <div>
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

        {abaAtiva === 'manutencoes' && (
          <div
            id="painel-manutencoes"
            role="tabpanel"
            aria-labelledby="aba-manutencoes"
            className={estilos.painel}
          >
            <div className={estilos.colunas}>
              <div>
                <h2 className={estilos.tituloSecao}>Histórico</h2>
                {manutencoes.carregando && (
                  <Skeleton descricao="Carregando o histórico de manutenções." linhas={3} />
                )}
                {manutencoes.erro && (
                  <EstadoErro mensagem={manutencoes.erro} aoTentarNovamente={manutencoes.recarregar} />
                )}
                {manutencoes.dados && manutencoes.dados.length === 0 && (
                  <p className={estilos.vazio}>
                    Nenhuma manutenção registrada. Se o item voltar ao uso, considere uma
                    preventiva antes.
                  </p>
                )}
                {manutencoes.dados && manutencoes.dados.length > 0 && (
                  <ul className={estilos.listaManutencoes}>
                    {manutencoes.dados.map((manutencao) => (
                      <li key={manutencao.id} className={estilos.manutencao}>
                        <p className={estilos.manutencaoTopo}>
                          <span className={`${estilos.tipo} ${estilos[manutencao.tipo]}`}>
                            {manutencao.tipo}
                          </span>
                          <time dateTime={manutencao.data}>{formatarData(manutencao.data)}</time>
                        </p>
                        <p className={estilos.manutencaoDescricao}>{manutencao.descricao}</p>
                        <p className={estilos.manutencaoTecnico}>Técnico: {manutencao.tecnico}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className={estilos.tituloSecao}>Registrar manutenção</h2>
                {temPerfil(['funcionario', 'administrador']) ? <Formulario onSubmit={aoRegistrarManutencao} noValidate className={estilos.formManutencao}>
                  <FieldCard
                    id="tipo-manutencao"
                    rotulo="Tipo"
                    tipo="select"
                    valor={form.tipo}
                    aoMudar={(valor) =>
                      setForm((atual) => ({ ...atual, tipo: valor as TipoManutencao }))
                    }
                    opcoes={[
                      { valor: 'preventiva', rotulo: 'Preventiva' },
                      { valor: 'corretiva', rotulo: 'Corretiva' },
                    ]}
                    desabilitado={enviando}
                  />
                  <FieldCard
                    id="descricao-manutencao"
                    rotulo="O que foi feito"
                    tipo="textarea"
                    valor={form.descricao}
                    aoMudar={(valor) => setForm((atual) => ({ ...atual, descricao: valor }))}
                    maxLength={280}
                    placeholder="Ex.: troca da fonte, teste de carga de 30 min"
                    desabilitado={enviando}
                  />
                  <FieldCard
                    id="tecnico-manutencao"
                    rotulo="Técnico responsável"
                    valor={form.tecnico}
                    aoMudar={(valor) => setForm((atual) => ({ ...atual, tecnico: valor }))}
                    maxLength={80}
                    desabilitado={enviando}
                  />

                  {erroForm && (
                    <p className={estilos.erroForm} role="alert">
                      {erroForm}
                    </p>
                  )}
                  {sucesso && (
                    <p className={estilos.sucessoForm} role="status">
                      {sucesso}
                    </p>
                  )}

                  <Button variante="primario" type="submit" disabled={enviando}>
                    {enviando ? 'Registrando…' : 'Registrar manutenção'}
                  </Button>
                </Formulario> : <p>Seu perfil permite consultar o histórico. O registro exige Funcionário ou Administrador.</p>}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'ciclo' && (
          <div id="painel-ciclo" role="tabpanel" aria-labelledby="aba-ciclo" className={estilos.painel}>
            <h2 className={estilos.tituloSecao}>Análise preventiva</h2>
            <p className={estilos.notaAnalise}>
              Regras simples sobre dados cadastrados — sem sensor e sem tempo real. A decisão
              final é sempre humana.
            </p>

            {analise.carregando && <Skeleton descricao="Calculando a análise preventiva." linhas={4} />}
            {analise.erro && <EstadoErro mensagem={analise.erro} aoTentarNovamente={analise.recarregar} />}

            {analise.dados && (
              <div>
                <p className={`${estilos.risco} ${estilos[`risco-${analise.dados.risco}`]}`}>
                  {ROTULO_RISCO[analise.dados.risco]} — {analise.dados.pontuacao} pontos
                </p>
                <ul className={estilos.fatores}>
                  {analise.dados.fatores.map((fator) => (
                    <li key={fator.rotulo} className={estilos.fator}>
                      <p className={estilos.fatorTopo}>
                        <strong>{fator.rotulo}</strong>
                        <span className={estilos.pontos}>
                          {fator.pontos} {fator.pontos === 1 ? 'ponto' : 'pontos'}
                        </span>
                      </p>
                      <p className={estilos.fatorDetalhe}>{fator.detalhe}</p>
                    </li>
                  ))}
                </ul>
                <p className={estilos.recomendacao}>
                  <strong>Recomendação:</strong> {analise.dados.recomendacao}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}
