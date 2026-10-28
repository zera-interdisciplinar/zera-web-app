import { Link } from 'react-router-dom'
import estilos from '../../../styles/pages/TriagemPage/TriagemPage.module.css'
import { useFluxoTriagem } from '../../hooks/useFluxoTriagem'
import {
ITENS_CHECKLIST
} from '../../reducers/triagemReducer'
import type { FluxoTriagemProps } from '../../types/componentes/FluxoTriagem'
import type { Classificacao } from '../../types/produto'
import { formatarData } from '../../utils/formatacao'
import { Button } from '../Button'
import { EmptyState } from '../EmptyState'
import { EstadoErro } from '../EstadoErro'
import { Formulario } from '../Formulario'
import { PageHeader } from '../PageHeader'
import { Skeleton } from '../Skeleton'
import { StatusText } from '../StatusText'
import { Stepper } from '../Stepper'
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

export function FluxoTriagem({ produtoId }: FluxoTriagemProps) {
  const { usuario, produto, categorias, estado, despachar, exigeChecklist, aoConcluir } = useFluxoTriagem({ produtoId })

  if (produto.carregando || categorias.carregando) {
    return <><PageHeader titulo="Triagem" subtitulo="Carregando os dados do item." /><Skeleton descricao="Carregando o item para triagem." linhas={4} /></>
  }

  if (produto.erro || categorias.erro) {
    return <><PageHeader titulo="Triagem" subtitulo="Não foi possível carregar os dados necessários." /><EstadoErro mensagem={produto.erro ?? categorias.erro!} aoTentarNovamente={produto.erro ? produto.recarregar : categorias.recarregar} /></>
  }
  const item = produto.dados

  if (!item) return <EmptyState nivelTitulo="h1" titulo="Item não encontrado" descricao="Abra a triagem a partir de um item do inventário." />
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
          <Formulario noValidate onSubmit={(evento) => { evento.preventDefault(); despachar({ tipo: 'avancar', exigeChecklist }) }}>
            <h2 className="titulo-card">Classificação</h2>
            <p className={estilos.contextoItem}>
              {item.categoriaNome} · entrou em {formatarData(item.dataEntrada)} · {item.diasEmEstoque} dias em estoque
            </p>

            <fieldset id="triagem-classificacao" className={estilos.opcoes} role="radiogroup" aria-label="Classificação do item" aria-required="true" aria-invalid={estado.erro && !estado.classificacao ? true : undefined} aria-describedby={estado.erro && !estado.classificacao ? 'triagem-classificacao-erro' : undefined}>
              <legend>Classificação <span aria-label="obrigatório">*</span></legend>
              {(Object.keys(ROTULO_CLASSIFICACAO) as Classificacao[]).map((opcao) => (
                <label
                  key={opcao}
                  className={`${estilos.opcao} ${estado.classificacao === opcao ? estilos.opcaoMarcada : ''}`}
                >
                  <input
                    type="radio"
                    name="classificacao"
                    required
                    value={opcao}
                    checked={estado.classificacao === opcao}
                    onChange={() => despachar({ tipo: 'classificar', classificacao: opcao })}
                  />
                  <span className={estilos.opcaoTitulo}>{ROTULO_CLASSIFICACAO[opcao].titulo}</span>
                  <span className={estilos.opcaoDetalhe}>{ROTULO_CLASSIFICACAO[opcao].detalhe}</span>
                </label>
              ))}
            </fieldset>

            {estado.erro && (
              <p id="triagem-classificacao-erro" className={estilos.erro} role="alert">
                {estado.erro}
              </p>
            )}

            <div className={estilos.acoes}>
              <Link to={`/itens/${item.id}`} className="link-botao">Voltar</Link>
              <Button
                variante="primario"
                type="submit"
              >
                Avançar
              </Button>
            </div>
          </Formulario>
        )}

        {estado.etapa === 'periculosidade' && (
          <Formulario noValidate onSubmit={(evento) => { evento.preventDefault(); despachar({ tipo: 'avancar', exigeChecklist }) }}>
            <h2 className="titulo-card">Checklist de periculosidade</h2>
            <p className={estilos.contextoItem}>
              {item.categoriaNome} é resíduo de risco. Confira cada ponto no item físico antes de
              liberar o descarte.
            </p>

            <fieldset id="triagem-checklist" className={estilos.checklist} aria-invalid={estado.erro ? true : undefined} aria-describedby={estado.erro ? 'triagem-checklist-erro' : undefined}>
              <legend className="somente-leitor-de-tela">
                Itens obrigatórios do checklist de periculosidade
              </legend>
              {ITENS_CHECKLIST.map((ponto) => (
                <label key={ponto} className={estilos.checkItem}>
                  <input
                    type="checkbox"
                    required
                    checked={estado.checklist[ponto] === true}
                    onChange={() => despachar({ tipo: 'alternar-checklist', item: ponto })}
                  />
                  <span>{ponto}</span>
                </label>
              ))}
            </fieldset>

            {estado.erro && (
              <p id="triagem-checklist-erro" className={estilos.erro} role="alert">
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
                type="submit"
              >
                Avançar para confirmação
              </Button>
            </div>
          </Formulario>
        )}

        {estado.etapa === 'confirmacao' && estado.classificacao && (
          <div>
            <h2 className="titulo-card">Confirmação</h2>

            <dl className={estilos.resumo}>
              <div>
                <dt>Item</dt>
                <dd>
                  {item.marca} {item.nome}
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
                <Link to={`/itens/${item.id}`} className="link-botao">Abrir ficha do item</Link>
                <Link to="/itens" className="link-botao">Voltar para itens</Link>
              </>
            }
          />
        )}
      </section>
    </>
  )
}
