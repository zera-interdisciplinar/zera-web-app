import { useMemo } from 'react'
import estilos from '../../../styles/pages/RelatoriosPage/RelatoriosPage.module.css'
import { Button } from '../../components/Button'
import type { Coluna } from '../../components/DataTable'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { Logo } from '../../components/Logo'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useAmbiente } from '../../hooks/useAmbiente'
import { useRelatorios } from '../../hooks/useRelatorios'
import { ROTULO_CONDICAO } from '../../types/produto'
import type { Relatorio } from '../../types/relatorio'
import { formatarData, pluralizar } from '../../utils/formatacao'

export default function RelatoriosPage() {
  const { modoDemonstracao } = useAmbiente()
  const {
    usuario,
    podeEnviar,
    relatorios,
    recicladoras,
    toast,
    modalAberto,
    setModalAberto,
    etapa,
    setEtapa,
    recicladoraId,
    setRecicladoraId,
    erroRecicladora,
    setErroRecicladora,
    enviando,
    erroEnvio,
    previa,
    recicladoraSelecionada,
    categoriasDaPrevia,
    dataDaPrevia,
    abrirPrevia,
    aoRevisar,
    aoConfirmarEnvio,
  } = useRelatorios()

  // Preserva as definições da tabela enquanto o formulário é atualizado.
  const colunas = useMemo<Coluna<Relatorio>[]>(
    () => [
      { titulo: 'Período', render: (relatorio) => relatorio.periodo },
      {
        titulo: 'Itens',
        numerica: true,
        render: (relatorio) =>
          `${relatorio.totalItens} ${pluralizar(relatorio.totalItens, 'item', 'itens')}`,
      },
      { titulo: 'Destino', render: (relatorio) => relatorio.recicladoraNome },
      {
        titulo: 'Status',
        render: () => <span className={estilos.enviado}>Enviado</span>,
      },
      {
        titulo: 'Enviado em',
        render: (relatorio) => formatarData(relatorio.criadoEm),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        titulo="Relatórios de descarte"
        subtitulo="Consolidação e envio de lotes às cooperativas."
      />

      <div className={estilos.toolbar}>
        <p className={estilos.nota}>
          Nada é enviado sem revisão humana — a prévia mostra exatamente o que sai no documento.
        </p>
        {modoDemonstracao && <Button variante="primario" onClick={abrirPrevia}>
          Novo relatório
        </Button>}
      </div>

      <section className={estilos.cartao} aria-labelledby="titulo-lista">
        <h2 className="titulo-card" id="titulo-lista">
          Relatórios enviados
        </h2>

        {relatorios.carregando && <Skeleton descricao="Carregando os relatórios." linhas={3} />}
        {relatorios.erro && (
          <EstadoErro mensagem={relatorios.erro} aoTentarNovamente={relatorios.recarregar} />
        )}

        {relatorios.dados && relatorios.dados.length === 0 && (
          <EmptyState
            titulo="Nenhum relatório enviado ainda"
            descricao="Quando um lote de descartáveis for consolidado e enviado à cooperativa, o registro aparece aqui."
          />
        )}

        {relatorios.dados && relatorios.dados.length > 0 && (
          <DataTable
            colunas={colunas}
            dados={relatorios.dados}
            chave={(relatorio) => relatorio.id}
            legenda="Relatórios de descarte enviados às cooperativas"
          />
        )}
      </section>

      <Modal
        aberto={modalAberto}
        titulo={etapa === 'previa' ? 'Prévia da cotação de equipamentos' : 'Confirmar envio do relatório'}
        aoFechar={() => setModalAberto(false)}
        larguraMaxima={1040}
      >
        {etapa === 'previa' && (
          <div>
            {previa.carregando && (
              <Skeleton descricao="Gerando a prévia do relatório." linhas={4} />
            )}
            {previa.erro && (
              <EstadoErro mensagem={previa.erro} aoTentarNovamente={previa.recarregar} />
            )}

            {previa.dados && previa.dados.itens.length === 0 && (
              <p className={estilos.textoModal}>
                Nenhum item descartável aguardando saída. Quando a triagem classificar itens como
                descartáveis, eles aparecem aqui para revisão.
              </p>
            )}

            {previa.dados && previa.dados.itens.length > 0 && (
              <>
                <article className={estilos.documento} aria-label="Prévia do relatório">
                  <header className={estilos.topoDocumento}>
                    <Logo />
                    <div>
                      <h2>Cotação de equipamentos</h2>
                      <p>Solicitação de coleta e destino</p>
                    </div>
                  </header>

                  <section className={estilos.blocoDocumento}>
                    <h3 className={estilos.rotuloSecao}>Informações da cotação</h3>
                    <div className={estilos.informacoesCotacao}>
                      <div>
                        <p>Número de cotação: —</p>
                        <p>Data de emissão: {dataDaPrevia}</p>
                        <p>Prazo da proposta: —</p>
                      </div>
                      <div>
                        <p>Solicitante: {usuario?.nome ?? 'Não informado'}</p>
                        <p>Responsável: {usuario?.nome ?? 'Não informado'}</p>
                      </div>
                    </div>
                  </section>

                  <section className={estilos.blocoDocumento}>
                    <h3 className={estilos.rotuloSecao}>Overview de categorias selecionadas para descarte</h3>
                    <p>Abaixo estão as categorias de equipamentos selecionadas para coleta e descarte.</p>
                    <p>Os itens serão avaliados conforme as informações disponíveis no cadastro.</p>
                    <ul className={estilos.categoriasPrevia}>
                      {categoriasDaPrevia.map((categoria) => (
                        <li key={categoria.nome}>
                          {categoria.nome}: {categoria.quantidade}{' '}
                          {pluralizar(categoria.quantidade, 'unidade', 'unidades')}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className={estilos.blocoDocumento}>
                    <h3 className={estilos.rotuloSecao}>Informações dos conteúdos</h3>
                    <div className={estilos.listaEquipamentos} tabIndex={0} aria-label="Itens da prévia do relatório">
                      {previa.dados.itens.map((item, indice) => (
                        <article key={item.produtoId} className={estilos.equipamento}>
                          <div className={estilos.colunaEquipamento}>
                            <h4>Item {indice + 1} - {item.modelo} em estoque</h4>
                            <p>Tipo de equipamento: {item.categoriaNome}</p>
                            <p>Marca: {item.fabricante}</p>
                            <p>Modelo: {item.modelo}</p>
                            <p>Quantidade: 1</p>
                            <p>Número patrimonial: —</p>
                            <p>Número de série: —</p>
                          </div>
                          <div className={estilos.colunaEquipamento}>
                            <p>Unidade/Local de origem: Não informado</p>
                            <p>Situação: Descartável</p>
                            <p>Condição: {ROTULO_CONDICAO[item.condicao]}</p>
                            <p>Descrição: {item.descricao}</p>
                            <p>Tempo em estoque: {item.diasEmEstoque} dias</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className={estilos.blocoDocumento}>
                    <h3 className={estilos.rotuloSecao}>Resumo</h3>
                    <p>
                      Prévia gerada em {dataDaPrevia} contendo {previa.dados.totalItens}{' '}
                      {pluralizar(previa.dados.totalItens, 'item', 'itens')} selecionados para descarte.
                    </p>
                    <ul className={estilos.categoriasPrevia}>
                      <li>{previa.dados.totalItens} {pluralizar(previa.dados.totalItens, 'item', 'itens')} para descarte</li>
                      <li>Categorias: {categoriasDaPrevia.map((categoria) => categoria.nome).join(', ')}</li>
                    </ul>
                  </section>

                  <footer className={estilos.rodapeDocumento}>
                    <strong>TRANSFORMANDO</strong>
                    <span>zera.institutojf@gmail.com</span>
                  </footer>
                </article>

                {podeEnviar && <div className={estilos.campoDestino}>
                  <FieldCard
                    id="relatorio-recicladora"
                    rotulo="Cooperativa de destino"
                    tipo="select"
                    valor={recicladoraId}
                    aoMudar={(valor) => {
                      setRecicladoraId(valor)
                      setErroRecicladora(null)
                    }}
                    erro={erroRecicladora ?? undefined}
                    opcoes={[
                      { valor: '', rotulo: 'Selecione a cooperativa' },
                      ...(recicladoras.dados ?? []).map((recicladora) => ({
                        valor: String(recicladora.id),
                        rotulo: `${recicladora.nome} — ${recicladora.cidade}`,
                      })),
                    ]}
                  />
                </div>}
                {!podeEnviar && <p>O envio à recicladora exige revisão e confirmação de um administrador.</p>}

                {erroEnvio && (
                  <p className={estilos.erroModal} role="alert">
                    {erroEnvio}
                  </p>
                )}

                <div className={estilos.acoesModal}>
                  {podeEnviar && <Button variante="navy" tamanho="grande" onClick={aoRevisar}>
                    Revisar envio
                  </Button>}
                  <Button variante="secundario" tamanho="grande" onClick={() => setModalAberto(false)}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {podeEnviar && etapa === 'confirmacao' && previa.dados && (
          <div>
            <p className={estilos.textoModal}>Confirmar envio do relatório?</p>
            <p className={estilos.detalheModal}>
              {previa.dados.totalItens} {pluralizar(previa.dados.totalItens, 'item será marcado', 'itens serão marcados')}{' '}
              como descartados e o relatório segue para{' '}
              {recicladoraSelecionada?.nome ?? 'a cooperativa selecionada'}. Essa operação não é
              desfeita pelo sistema.
            </p>
            <div className={estilos.acoesModal}>
              <Button
                variante="perigo"
                tamanho="grande"
                onClick={aoConfirmarEnvio}
                disabled={enviando}
              >
                {enviando ? 'Enviando…' : 'Confirmar envio'}
              </Button>
              <Button
                variante="secundario"
                tamanho="grande"
                onClick={() => setEtapa('previa')}
                disabled={enviando}
              >
                Voltar à prévia
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Toast mensagem={toast} />
    </>
  )
}
