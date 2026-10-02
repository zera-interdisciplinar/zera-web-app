import { useReducer } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { StatusText } from '../../components/StatusText'
import { Stepper } from '../../components/Stepper'
import { useAuth } from '../../hooks/useAuth'
import { useCategorias } from '../../hooks/useCategorias'
import { useProduto } from '../../hooks/useProduto'
import {
  ITENS_CHECKLIST,
  estadoInicialTriagem,
  triagemReducer,
} from '../../reducers/triagemReducer'
import { registrarTriagem } from '../../services/produtoService'
import { modoDemonstracao } from '../../services/apiReal'
import { mensagemDeErro } from '../../types/api'
import type { Classificacao } from '../../types/produto'
import { formatarData } from '../../utils/formatacao'
import estilos from './TriagemPage.module.css'

const ROTULO_CLASSIFICACAO: Record<Classificacao, { titulo: string; detalhe: string }> = {
  reutilizavel: {
    titulo: 'Reutilizável',
    detalhe: 'Volta ao uso depois de limpeza e teste básico.',
  },
  aproveitavel: {
    titulo: 'Aproveitável para peças',
    detalhe: 'Não volta inteiro, mas rende memória, SSD, tela ou fonte.',
  },
  descartavel: {
    titulo: 'Descartável',
    detalhe: 'Sem recuperação. Entra no lote monitorado até o envio à cooperativa.',
  },
}

export default function TriagemPage() {
  const { id } = useParams<{ id: string }>()

  if (!id || (modoDemonstracao && Number.isNaN(Number(id)))) {
    return (
      <EmptyState
        nivelTitulo="h1"
        titulo="Item não encontrado"
        descricao="O endereço não traz um identificador válido. Abra a triagem a partir da ficha do item."
        acao={
          <Link to="/itens">
            <Button variante="primario">Voltar para itens</Button>
          </Link>
        }
      />
    )
  }

  if (!modoDemonstracao) {
    return <EmptyState nivelTitulo="h1" titulo="Triagem indisponível nesta integração" descricao="A API real não documenta a triagem deste formulário. As transições de item exigem ações e dados diferentes." acao={<Link to={`/itens/${id}`}><Button variante="primario">Voltar para o item</Button></Link>} />
  }
  return <FluxoTriagem key={id} produtoId={Number(id)} />
}

function FluxoTriagem({ produtoId }: { produtoId: number }) {
  const { usuario } = useAuth()
  const produto = useProduto(produtoId)
  const categorias = useCategorias()
  const [estado, despachar] = useReducer(triagemReducer, estadoInicialTriagem)

  const categoria = categorias.dados?.find((item) => item.id === produto.dados?.categoriaId)
  const exigeChecklist = categoria?.exigeChecklistPericulosidade ?? false

  async function aoConcluir() {
    if (!estado.classificacao) return

    despachar({ tipo: 'envio-iniciado' })
    try {
      await registrarTriagem({
        produtoId,
        classificacao: estado.classificacao,
        checklistPericulosidade: ITENS_CHECKLIST.filter((item) => estado.checklist[item]),
        responsavel: usuario?.nome ?? 'operador não identificado',
      })
      despachar({ tipo: 'envio-concluido' })
    } catch (falha) {
      despachar({ tipo: 'envio-falhou', mensagem: mensagemDeErro(falha) })
    }
  }

  if (produto.carregando || categorias.carregando) {
    return <Skeleton descricao="Carregando o item para triagem." linhas={4} />
  }

  if (produto.erro) {
    return <EstadoErro mensagem={produto.erro} aoTentarNovamente={produto.recarregar} />
  }

  const item = produto.dados
  if (!item) return null

  const comChecklist = exigeChecklist && estado.classificacao === 'descartavel'
  const etapas = comChecklist
    ? ['Classificação', 'Checklist de periculosidade', 'Confirmação']
    : ['Classificação', 'Confirmação']
  const indiceAtual =
    estado.etapa === 'classificacao'
      ? 0
      : estado.etapa === 'periculosidade'
        ? 1
        : estado.etapa === 'confirmacao'
          ? comChecklist
            ? 2
            : 1
          : etapas.length - 1

  return (
    <>
      <PageHeader
        titulo="Triagem"
        subtitulo={`${item.marca} ${item.nome} — classifique o destino e confirme.`}
      />

      {estado.etapa !== 'concluida' && <Stepper etapas={etapas} atual={indiceAtual} />}

      <section className={estilos.cartao}>
        {estado.etapa === 'classificacao' && (
          <div>
            <h2 className="titulo-card">Classificação</h2>
            <p className={estilos.contextoItem}>
              <span className="texto-mono">{item.codigoBarras}</span> · {item.categoriaNome} ·
              entrou em {formatarData(item.dataEntrada)} · {item.diasEmEstoque} dias em estoque
            </p>

            <div className={estilos.opcoes} role="radiogroup" aria-label="Classificação do item">
              {(Object.keys(ROTULO_CLASSIFICACAO) as Classificacao[]).map((opcao) => (
                <label
                  key={opcao}
                  className={`${estilos.opcao} ${estado.classificacao === opcao ? estilos.opcaoMarcada : ''}`}
                >
                  <input
                    type="radio"
                    name="classificacao"
                    value={opcao}
                    checked={estado.classificacao === opcao}
                    onChange={() => despachar({ tipo: 'classificar', classificacao: opcao })}
                  />
                  <span className={estilos.opcaoTitulo}>{ROTULO_CLASSIFICACAO[opcao].titulo}</span>
                  <span className={estilos.opcaoDetalhe}>{ROTULO_CLASSIFICACAO[opcao].detalhe}</span>
                </label>
              ))}
            </div>

            {estado.erro && (
              <p className={estilos.erro} role="alert">
                {estado.erro}
              </p>
            )}

            <div className={estilos.acoes}>
              <Link to={`/itens/${item.id}`}>
                <Button variante="secundario">Voltar</Button>
              </Link>
              <Button
                variante="primario"
                onClick={() => despachar({ tipo: 'avancar', exigeChecklist })}
              >
                Avançar
              </Button>
            </div>
          </div>
        )}

        {estado.etapa === 'periculosidade' && (
          <div>
            <h2 className="titulo-card">Checklist de periculosidade</h2>
            <p className={estilos.contextoItem}>
              {item.categoriaNome} é resíduo de risco. Confira cada ponto no item físico antes de
              liberar o descarte.
            </p>

            <fieldset className={estilos.checklist}>
              <legend className="somente-leitor-de-tela">
                Itens obrigatórios do checklist de periculosidade
              </legend>
              {ITENS_CHECKLIST.map((ponto) => (
                <label key={ponto} className={estilos.checkItem}>
                  <input
                    type="checkbox"
                    checked={estado.checklist[ponto] === true}
                    onChange={() => despachar({ tipo: 'alternar-checklist', item: ponto })}
                  />
                  <span>{ponto}</span>
                </label>
              ))}
            </fieldset>

            {estado.erro && (
              <p className={estilos.erro} role="alert">
                {estado.erro}
              </p>
            )}

            <div className={estilos.acoes}>
              <Button
                variante="secundario"
                onClick={() => despachar({ tipo: 'voltar', exigeChecklist })}
              >
                Voltar
              </Button>
              <Button
                variante="primario"
                onClick={() => despachar({ tipo: 'avancar', exigeChecklist })}
              >
                Avançar para confirmação
              </Button>
            </div>
          </div>
        )}

        {estado.etapa === 'confirmacao' && estado.classificacao && (
          <div>
            <h2 className="titulo-card">Confirmação</h2>

            <dl className={estilos.resumo}>
              <div>
                <dt>Item</dt>
                <dd>
                  {item.marca} {item.nome} (<span className="texto-mono">{item.codigoBarras}</span>)
                </dd>
              </div>
              <div>
                <dt>Destino</dt>
                <dd>
                  <StatusText status={estado.classificacao} />
                </dd>
              </div>
              <div>
                <dt>Responsável</dt>
                <dd>{usuario?.nome ?? '—'}</dd>
              </div>
              {comChecklist && (
                <div>
                  <dt>Checklist de periculosidade</dt>
                  <dd>{ITENS_CHECKLIST.length} itens conferidos</dd>
                </div>
              )}
            </dl>

            {estado.erro && (
              <p className={estilos.erro} role="alert">
                {estado.erro}
              </p>
            )}

            <div className={estilos.acoes}>
              <Button
                variante="secundario"
                onClick={() => despachar({ tipo: 'voltar', exigeChecklist })}
                disabled={estado.enviando}
              >
                Voltar
              </Button>
              <Button variante="primario" onClick={aoConcluir} disabled={estado.enviando}>
                {estado.enviando ? 'Registrando…' : 'Concluir triagem'}
              </Button>
            </div>
            {estado.enviando && (
              <p className={estilos.aviso} role="status">
                Gravando a classificação no inventário…
              </p>
            )}
          </div>
        )}

        {estado.etapa === 'concluida' && estado.classificacao && (
          <EmptyState
            titulo="Triagem registrada"
            descricao={`${item.marca} ${item.nome} foi classificado como ${ROTULO_CLASSIFICACAO[estado.classificacao].titulo.toLowerCase()}. O inventário já reflete a decisão.`}
            acao={
              <>
                <Link to={`/itens/${item.id}`}>
                  <Button variante="primario">Abrir ficha do item</Button>
                </Link>
                <Link to="/itens">
                  <Button variante="secundario">Voltar para itens</Button>
                </Link>
              </>
            }
          />
        )}
      </section>
    </>
  )
}
