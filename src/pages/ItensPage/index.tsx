import { Formulario } from '../../components/Formulario'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import type { Coluna } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { FilterChip } from '../../components/FilterChip'
import { IconButton } from '../../components/IconButton'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { StatusText } from '../../components/StatusText'
import { Toast } from '../../components/Toast'
import { useCategorias } from '../../hooks/useCategorias'
import { useCadastroItens } from '../../hooks/useCadastroItens'
import { useProdutos } from '../../hooks/useProdutos'
import type { FiltroItens, ProdutoDetalhado, StatusItem } from '../../types/produto'
import { ROTULO_CONDICAO, ROTULO_STATUS } from '../../types/produto'
import { formatarDataRelativa, pluralizar } from '../../utils/formatacao'
import estilos from '../../../styles/pages/ItensPage/ItensPage.module.css'
import { useAuth } from '../../hooks/useAuth'
import { useCadastroCategoria } from '../../hooks/useCadastroCategoria'
import { useCadastroModelo } from '../../hooks/useCadastroModelo'
import { CadastroModelo } from '../../components/CadastroModelo'
import { usePermissoes } from '../../hooks/usePermissoes'
import { normalizarBusca } from '../../utils/busca'

const STATUS_OPCOES = (Object.keys(ROTULO_STATUS) as StatusItem[]).map((valor) => ({
  valor,
  rotulo: ROTULO_STATUS[valor],
}))

export default function ItensPage() {
  const { usuario } = useAuth()
  const permissoes = usePermissoes()
  const produtos = useProdutos()
  const categorias = useCategorias()
  const [parametros, setParametros] = useSearchParams()
  const {
    modelos, modoDemonstracao, criado, limparSucesso,
    modalAberto, editando, form, setForm, erros, enviando, erroEnvio,
    confirmandoDescarte, setConfirmandoDescarte, excluindo, setExcluindo,
    processandoExclusao, erroExclusao, abrirCadastro, abrirEdicao, tentarFecharModal,
    aoSalvar, aoConfirmarExclusao, setModalAberto, toast,
    podeCadastrar, podeExcluir,
  } = useCadastroItens(produtos.recarregar)
  const sucessoRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (criado) sucessoRef.current?.focus() }, [criado])
  const categoriaRapida = useCadastroCategoria((categoria) => setForm((atual) => ({ ...atual, categoriaId: String(categoria.id), modelId: '' })))
  const modeloRapido = useCadastroModelo((modelo) => setForm((atual) => ({ ...atual, categoriaId: String(modelo.categoriaId), modelId: String(modelo.id) })))

  const categoriaDaUrl = parametros.get('categoria')
  const responsavelDaUrl = parametros.get('responsavel')
  const periodoDaUrl = parametros.get('periodo')
  const filtro = useMemo<FiltroItens>(() => ({
    busca: parametros.get('q') ?? '',
    status: STATUS_OPCOES.find((opcao) => opcao.valor === parametros.get('status'))?.valor ?? 'todos',
  }), [parametros])
  function setFiltro(atualizar: FiltroItens | ((atual: FiltroItens) => FiltroItens)) {
    const proximo = typeof atualizar === 'function' ? atualizar(filtro) : atualizar
    setParametros((atuais) => {
      const novos = new URLSearchParams(atuais)
      if (proximo.busca) novos.set('q', proximo.busca); else novos.delete('q')
      if (proximo.status !== 'todos') novos.set('status', proximo.status); else novos.delete('status')
      return novos
    }, { replace: true })
  }
  const filtrosSujos = filtro.busca.trim() !== '' || filtro.status !== 'todos' || Boolean(categoriaDaUrl || responsavelDaUrl || periodoDaUrl)
  function limparFiltros() { setParametros({}) }

  const visiveis = useMemo<ProdutoDetalhado[]>(() => {
    const dados = produtos.dados ?? []
    const termo = normalizarBusca(filtro.busca)

    return dados.filter((produto) => {
      if (categoriaDaUrl && String(produto.categoriaId) !== categoriaDaUrl) return false
      if (responsavelDaUrl && produto.responsavel !== responsavelDaUrl) return false
      const meses = periodoDaUrl === 'últimos 3 meses' ? 3 : periodoDaUrl === 'últimos 6 meses' ? 6 : periodoDaUrl === 'último ano' ? 12 : null
      if (meses !== null) {
        const limite = new Date()
        limite.setMonth(limite.getMonth() - meses)
        if (Date.parse(produto.atualizacao) < limite.getTime()) return false
      }
      if (filtro.status !== 'todos' && produto.status !== filtro.status) return false
      if (termo.length === 0) return true
      return (
        normalizarBusca(produto.nome).includes(termo) ||
        normalizarBusca(produto.marca).includes(termo) ||
        normalizarBusca(produto.categoriaNome).includes(termo)
      )
    })
  }, [produtos.dados, filtro, categoriaDaUrl, responsavelDaUrl, periodoDaUrl])

  const colunas = useMemo<Coluna<ProdutoDetalhado>[]>(
    () => [
      {
        titulo: 'Item',
        render: (produto) => (
          <Link className={estilos.linkItem} to={`/itens/${produto.id}`}>
            {produto.nome}
          </Link>
        ),
      },
      { titulo: 'Categoria', render: (produto) => produto.categoriaNome },
      { titulo: 'Status', render: (produto) => <StatusText status={produto.status} /> },
      ...(usuario?.perfil !== 'funcionario' ? [{ titulo: 'Cadastrado por', render: (produto: ProdutoDetalhado) => produto.responsavel }] : []),
      { titulo: 'Atualização', render: (produto) => formatarDataRelativa(produto.atualizacao) },
      ...[{
        titulo: 'Ação',
        render: (produto: ProdutoDetalhado) => (
          <span className={estilos.acoes}>
            {modoDemonstracao && <IconButton rotulo={`Editar ${produto.nome}`} onClick={() => abrirEdicao(produto)}>
              <Pencil size={18} aria-hidden="true" />
            </IconButton>}
            {podeExcluir && <><span className={estilos.divisor} aria-hidden="true" />
            <IconButton rotulo={`Excluir ${produto.nome}`} onClick={() => setExcluindo(produto)}>
              <Trash2 size={18} aria-hidden="true" />
            </IconButton></>}
          </span>
        ),
      }],
    ],
    [abrirEdicao, setExcluindo, modoDemonstracao, podeExcluir, usuario?.perfil],
  )

  return (
    <>
      <PageHeader
        titulo="Gestão de itens"
        subtitulo="Cadastre, filtre e acompanhe o ciclo de cada item."
      />
      {criado && <section className={estilos.cartao} aria-label="Cadastro concluído">
        <h2 ref={sucessoRef} tabIndex={-1}>Item cadastrado</h2>
        <p role="status">Etiqueta: {criado.codigoExibicao || criado.codigoBarras}</p>
        <Link className="link-botao" to={`/itens/${criado.id}`}>Ver item</Link>
        <Button onClick={() => { limparSucesso(); abrirCadastro() }}>Cadastrar outro item</Button>
      </section>}

      <div className={estilos.toolbar}>
        <SearchInput
          id="busca-itens"
          rotulo="Pesquisar item por nome, marca ou categoria"
          valor={filtro.busca}
          aoMudar={(valor) => setFiltro((atual) => ({ ...atual, busca: valor }))}
        />
        <div className={estilos.toolbarDireita}>
          <FilterChip
            rotulo={
              filtro.status === 'todos' ? 'Status' : `Status: ${ROTULO_STATUS[filtro.status]}`
            }
            opcoes={[{ valor: 'todos', rotulo: 'Todos os status' }, ...STATUS_OPCOES]}
            valorAtual={filtro.status}
            aoSelecionar={(valor) => {
              const status = valor as StatusItem | 'todos'
              setFiltro((atual) => ({ ...atual, status }))
            }}
          />
          {filtrosSujos && (
            <button type="button" className={estilos.limpar} onClick={limparFiltros}>
              <RotateCcw size={14} aria-hidden="true" />
              Limpar filtros
            </button>
          )}
          {podeCadastrar && <Button id="adicionar-item" variante="primario" onClick={abrirCadastro}>
            Adicionar item
          </Button>}
        </div>
      </div>

      <section className={estilos.cartao} aria-labelledby="titulo-lista">
        <div className={estilos.topoCartao}>
          <h2 className="titulo-card" id="titulo-lista">
            Todos os itens
          </h2>
          <p className={estilos.contagem} aria-live="polite">
            {produtos.carregando
              ? 'Carregando…'
              : `${visiveis.length} ${pluralizar(visiveis.length, 'item', 'itens')}`}
          </p>
        </div>

        {produtos.carregando && <Skeleton descricao="Carregando os itens do inventário." linhas={5} />}
        {produtos.erro && <EstadoErro mensagem={produtos.erro} aoTentarNovamente={produtos.recarregar} />}

        {!produtos.carregando && !produtos.erro && produtos.dados && visiveis.length === 0 && (
          <EmptyState
            titulo={filtro.busca || filtro.status !== 'todos' ? 'Nenhum item com esses filtros' : 'Nenhum item cadastrado ainda'}
            descricao={
              filtro.busca || filtro.status !== 'todos'
                ? 'Ajuste a busca ou o filtro de status para encontrar o item.'
                : 'Cadastre o primeiro item para começar o inventário.'
            }
            acao={
              filtrosSujos ? (
                <button type="button" className={estilos.limpar} onClick={limparFiltros}>
                  <RotateCcw size={14} aria-hidden="true" />
                  Limpar filtros
                </button>
              ) : (
                podeCadastrar ? <Button variante="primario" onClick={abrirCadastro}>
                  Adicionar item
                </Button> : undefined
              )
            }
          />
        )}

        {visiveis.length > 0 && (
          <DataTable
            colunas={colunas}
            dados={visiveis}
            chave={(produto) => produto.id}
            legenda="Itens do inventário com categoria, status, responsável e atualização"
          />
        )}
      </section>

      <Modal
        aberto={modalAberto}
        titulo={editando ? `Editar ${editando.nome}` : 'Cadastrar item'}
        aoFechar={tentarFecharModal}
      >
        {confirmandoDescarte ? (
          <div>
            <p className={estilos.textoModal}>Descartar as informações preenchidas?</p>
            <p className={estilos.detalheModal}>
              O item ainda não foi salvo. Ao fechar, o que você digitou se perde.
            </p>
            <div className={estilos.acoesModal}>
              <Button variante="perigo" tamanho="grande" onClick={() => setModalAberto(false)}>
                Descartar e fechar
              </Button>
              <Button
                variante="secundario"
                tamanho="grande"
                onClick={() => setConfirmandoDescarte(false)}
              >
                Continuar preenchendo
              </Button>
            </div>
          </div>
        ) : (
          <Formulario onSubmit={aoSalvar} noValidate>
            {categorias.carregando && <p className={estilos.statusModal} role="status">Carregando categorias…</p>}
            {categorias.erro && <EstadoErro mensagem={categorias.erro} aoTentarNovamente={categorias.recarregar} />}
            <div className={estilos.camposModal}>
              <FieldCard
                id="item-nome" obrigatorio
                rotulo="Item"
                valor={form.nome}
                aoMudar={(valor) => setForm((atual) => ({ ...atual, nome: valor }))}
                erro={erros.nome ?? erros.name}
                placeholder="Nome do item"
                maxLength={80}
                desabilitado={enviando}
              />
              <FieldCard
                id="item-material"
                rotulo="Categoria"
                tipo="select"
                valor={form.categoriaId}
                aoMudar={(valor) => valor === '__nova__' ? categoriaRapida.abrir() : setForm((atual) => ({ ...atual, categoriaId: valor, modelId: '' }))}
                erro={erros.categoriaId}
                desabilitado={enviando}
                opcoes={[
                  { valor: '', rotulo: 'Selecione uma categoria' },
                  ...(categorias.dados ?? []).map((categoria) => ({
                    valor: String(categoria.id),
                    rotulo: categoria.nome,
                  })),
                  ...(permissoes.cadastrarCategoria ? [{ valor: '__nova__', rotulo: '+ Nova categoria' }] : []),
                ]}
              />
              {modoDemonstracao ? <FieldCard
                id="item-marca"
                rotulo="Marca"
                valor={form.marca}
                aoMudar={(valor) => setForm((atual) => ({ ...atual, marca: valor }))}
                erro={erros.marca}
                placeholder="Ex.: Apple, Dell ou Samsung"
                maxLength={60}
                desabilitado={enviando}
              /> : <>
                <FieldCard id="item-modelo" obrigatorio rotulo="Modelo" tipo="select" valor={form.modelId}
                  aoMudar={(valor) => { if (valor === '__novo__') { modeloRapido.abrir(); modeloRapido.alterar('categoriaId', form.categoriaId) } else setForm((atual) => ({ ...atual, modelId: valor })) }}
                  erro={erros.modelId} desabilitado={enviando || modelos.carregando}
                  opcoes={[{ valor: '', rotulo: 'Selecione um modelo cadastrado' }, ...(modelos.dados ?? []).filter((modelo) => !form.categoriaId || String(modelo.categoriaId) === form.categoriaId).map((modelo) => ({ valor: String(modelo.id), rotulo: `${modelo.fabricante} ${modelo.nome}` })), ...(permissoes.cadastrarModelo ? [{ valor: '__novo__', rotulo: '+ Novo modelo' }] : [])]} />
                {modelos.carregando && <p className={estilos.statusModal} role="status">Carregando modelos…</p>}
                {modelos.erro && <EstadoErro mensagem={modelos.erro} aoTentarNovamente={modelos.recarregar} />}
                <FieldCard id="item-intensidade" obrigatorio rotulo="Intensidade de uso" tipo="select" valor={form.usageIntensity}
                  aoMudar={(valor) => setForm((atual) => ({ ...atual, usageIntensity: valor }))}
                  erro={erros.usageIntensity} desabilitado={enviando}
                  opcoes={[{ valor: '', rotulo: 'Selecione de 0 a 10' }, ...Array.from({ length: 11 }, (_, numero) => ({ valor: String(numero), rotulo: String(numero) }))]} />
                <FieldCard id="item-tem-danos" obrigatorio rotulo="O item apresenta danos?" tipo="select" valor={form.hasDamages}
                  aoMudar={(valor) => setForm((atual) => ({ ...atual, hasDamages: valor, damages: '' }))}
                  erro={erros.hasDamages} desabilitado={enviando}
                  opcoes={[{ valor: '', rotulo: 'Selecione uma opção' }, { valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }]} />
                {form.hasDamages === 'sim' && <FieldCard id="item-danos" obrigatorio rotulo="Dano identificado" tipo="select" valor={form.damages}
                  aoMudar={(valor) => setForm((atual) => ({ ...atual, damages: valor }))}
                  erro={erros.damages} desabilitado={enviando}
                  opcoes={[
                    { valor: '', rotulo: 'Selecione o dano' },
                    { valor: 'BROKEN_SCREEN', rotulo: 'Tela quebrada' },
                    { valor: 'MISSING_PART', rotulo: 'Peça ausente' },
                    { valor: 'DOES_NOT_POWER_ON', rotulo: 'Não liga' },
                    { valor: 'OXIDATION', rotulo: 'Oxidação' },
                    { valor: 'OTHER', rotulo: 'Outro dano' },
                  ]} />}
              </>}
              <FieldCard
                id="item-condicao" obrigatorio
                rotulo="Condição"
                tipo="select"
                valor={form.condicao}
                aoMudar={(valor) => setForm((atual) => ({ ...atual, condicao: valor }))}
                erro={erros.condicao ?? erros.condition}
                desabilitado={enviando}
                opcoes={[
                  { valor: '', rotulo: 'Novo, usado ou danificado' },
                  { valor: 'novo', rotulo: ROTULO_CONDICAO.novo },
                  { valor: 'usado', rotulo: ROTULO_CONDICAO.usado },
                  ...(!modoDemonstracao ? [{ valor: 'semidanificado', rotulo: ROTULO_CONDICAO.semidanificado }] : []),
                  { valor: 'danificado', rotulo: ROTULO_CONDICAO.danificado },
                ]}
              />
            </div>

            {erroEnvio && (
              <p className={estilos.erroModal} role="alert">
                {erroEnvio}
              </p>
            )}

            <div className={estilos.acoesModal}>
              <Button variante="primario" tamanho="grande" type="submit" disabled={enviando}>
                {enviando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Concluir cadastro'}
              </Button>
              <Button
                variante="secundario"
                tamanho="grande"
                onClick={tentarFecharModal}
                disabled={enviando}
              >
                Cancelar
              </Button>
            </div>
          </Formulario>
        )}
      </Modal>

      <Modal
        aberto={excluindo !== null}
        titulo={excluindo ? `Excluir ${excluindo.nome}` : 'Excluir item'}
        aoFechar={() => setExcluindo(null)}
        larguraMaxima={560}
      >
        {excluindo && (
          <div>
            <p className={estilos.textoModal}>Excluir {excluindo.nome} do inventário?</p>
            <p className={estilos.detalheModal}>
              {modoDemonstracao ? 'O item será excluído dos dados desta demonstração.' : 'O item será marcado como removido. Seu histórico será preservado.'}
            </p>
            {erroExclusao && <p className={estilos.erroModal} role="alert">{erroExclusao}</p>}
            <p role="status">{processandoExclusao ? 'Excluindo item…' : ''}</p>
            <div className={estilos.acoesModal}>
              <Button
                variante="perigo"
                tamanho="grande"
                onClick={aoConfirmarExclusao}
                disabled={processandoExclusao}
              >
                {processandoExclusao ? 'Excluindo…' : 'Excluir item'}
              </Button>
              <Button
                variante="secundario"
                tamanho="grande"
                onClick={() => setExcluindo(null)}
                disabled={processandoExclusao}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <CadastroModelo cadastro={modeloRapido} categorias={categorias} />
      <Modal aberto={categoriaRapida.aberto} titulo="Nova categoria" aoFechar={categoriaRapida.fechar}>
        <h2>Nova categoria</h2>
        <Formulario onSubmit={categoriaRapida.salvar} noValidate>
          <FieldCard id="categoria-rapida-nome" obrigatorio rotulo="Nome" valor={categoriaRapida.form.nome} aoMudar={(valor) => categoriaRapida.alterar('nome', valor)} erro={categoriaRapida.erros.nome} maxLength={80} />
          <FieldCard id="categoria-rapida-descricao" obrigatorio rotulo="Descrição" tipo="textarea" valor={categoriaRapida.form.descricao} aoMudar={(valor) => categoriaRapida.alterar('descricao', valor)} erro={categoriaRapida.erros.descricao} maxLength={255} />
          {categoriaRapida.erro && <p role="alert">{categoriaRapida.erro}</p>}
          <Button type="submit" disabled={categoriaRapida.enviando}>{categoriaRapida.enviando ? 'Salvando…' : 'Salvar categoria'}</Button>
          <Button onClick={categoriaRapida.fechar} disabled={categoriaRapida.enviando}>Cancelar</Button>
        </Formulario>
      </Modal>
      <Toast mensagem={toast} />
    </>
  )
}
