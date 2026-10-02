import { useCallback, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import type { Coluna } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useRequisicao } from '../../hooks/useRequisicao'
import { useToast } from '../../hooks/useToast'
import {
  enviarRelatorio,
  gerarPrevia,
  listarRecicladoras,
  listarRelatorios,
} from '../../services/relatorioService'
import { mensagemDeErro } from '../../types/api'
import { modoDemonstracao } from '../../services/apiReal'
import type { PreviaRelatorio, Recicladora, Relatorio } from '../../types/relatorio'
import { formatarData, pluralizar } from '../../utils/formatacao'
import { validarEnvioRelatorio } from '../../utils/validacao'
import estilos from './RelatoriosPage.module.css'

type EtapaModal = 'previa' | 'confirmacao'

export default function RelatoriosPage() {
  const buscarRelatorios = useCallback((sinal: AbortSignal) => listarRelatorios(sinal), [])
  const buscarRecicladoras = useCallback((sinal: AbortSignal) => listarRecicladoras(sinal), [])
  const buscarPrevia = useCallback((sinal: AbortSignal) => gerarPrevia(sinal), [])

  const relatorios = useRequisicao<Relatorio[]>(buscarRelatorios)
  const recicladoras = useRequisicao<Recicladora[]>(buscarRecicladoras)
  const [toast, mostrarToast] = useToast()

  const [modalAberto, setModalAberto] = useState(false)
  const [etapa, setEtapa] = useState<EtapaModal>('previa')
  const [recicladoraId, setRecicladoraId] = useState('')
  const [erroRecicladora, setErroRecicladora] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const previa = useRequisicao<PreviaRelatorio>(buscarPrevia, modalAberto)

  const recicladoraSelecionada = useMemo(
    () =>
      recicladoras.dados?.find((recicladora) => String(recicladora.id) === recicladoraId) ?? null,
    [recicladoras.dados, recicladoraId],
  )

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

  function abrirPrevia() {
    setEtapa('previa')
    setRecicladoraId('')
    setErroRecicladora(null)
    setErroEnvio(null)
    setModalAberto(true)
  }

  function aoRevisar() {
    const validacao = validarEnvioRelatorio({ recicladoraId: Number(recicladoraId) })
    setErroRecicladora(validacao.erros.recicladoraId ?? null)
    if (!validacao.valido) return
    setEtapa('confirmacao')
  }

  async function aoConfirmarEnvio() {
    if (!previa.dados) return
    setEnviando(true)
    setErroEnvio(null)
    try {
      const relatorio = await enviarRelatorio({
        recicladoraId: Number(recicladoraId),
        produtoIds: previa.dados.itens.map((item) => item.produtoId),
      })
      setModalAberto(false)
      mostrarToast(
        `Relatório de ${relatorio.periodo} enviado para ${relatorio.recicladoraNome}: ${relatorio.totalItens} ${pluralizar(relatorio.totalItens, 'item marcado', 'itens marcados')} como descartados.`,
      )
      relatorios.recarregar()
    } catch (falha) {
      setEtapa('previa')
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }

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
        titulo={etapa === 'previa' ? 'Prévia do relatório de descarte' : 'Confirmar envio do relatório'}
        aoFechar={() => setModalAberto(false)}
      >
        {etapa === 'previa' && (
          <div>
            {previa.carregando && (
              <Skeleton descricao="Gerando a prévia do relatório de descarte." linhas={4} />
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
                <p className={estilos.resumoPrevia}>
                  {previa.dados.totalItens} {pluralizar(previa.dados.totalItens, 'item', 'itens')}{' '}
                  classificados como descartáveis, do mais antigo ao mais recente.
                </p>
                <ul className={estilos.listaPrevia}>
                  {previa.dados.itens.map((item) => (
                    <li key={item.produtoId} className={estilos.itemPrevia}>
                      <span className="texto-mono">{item.codigoBarras}</span>
                      <span className={estilos.itemDescricao}>{item.descricao}</span>
                      <span className={estilos.itemDias}>{item.diasEmEstoque} dias</span>
                    </li>
                  ))}
                </ul>

                <div className={estilos.campoDestino}>
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
                </div>

                {erroEnvio && (
                  <p className={estilos.erroModal} role="alert">
                    {erroEnvio}
                  </p>
                )}

                <div className={estilos.acoesModal}>
                  <Button variante="navy" tamanho="grande" onClick={aoRevisar}>
                    Revisar envio
                  </Button>
                  <Button variante="secundario" tamanho="grande" onClick={() => setModalAberto(false)}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {etapa === 'confirmacao' && previa.dados && (
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
