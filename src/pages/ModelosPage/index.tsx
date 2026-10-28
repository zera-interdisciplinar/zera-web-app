import { CadastroModelo } from '../../components/CadastroModelo'
import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import type { Coluna } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useCategorias } from '../../hooks/useCategorias'
import { useCadastroModelo } from '../../hooks/useCadastroModelo'
import type { Modelo } from '../../types/modelo'
import { pluralizar } from '../../utils/formatacao'
import estilos from '../../../styles/pages/ModelosPage/ModelosPage.module.css'
import { CadastroCategoria } from '../../components/CadastroCategoria'
import { normalizarBusca } from '../../utils/busca'

export default function ModelosPage() {
  const categorias = useCategorias()
  const [busca, setBusca] = useState('')
  const cadastro = useCadastroModelo()
  const { modelos, permitido, modoDemonstracao, toast, abrir, alterar } = cadastro

  const visiveis = useMemo<Modelo[]>(() => {
    const dados = modelos.dados ?? []
    const termo = normalizarBusca(busca)
    if (termo.length === 0) return dados
    return dados.filter(
      (modelo) =>
        normalizarBusca(modelo.nome).includes(termo) ||
        normalizarBusca(modelo.fabricante).includes(termo) ||
        normalizarBusca(modelo.categoriaNome ?? '').includes(termo),
    )
  }, [modelos.dados, busca])

  const colunas = useMemo<Coluna<Modelo>[]>(
    () => [
      { titulo: 'Modelo', render: (modelo) => modelo.nome },
      { titulo: 'Fabricante', render: (modelo) => modelo.fabricante },
      { titulo: 'Categoria', render: (modelo) => modelo.categoriaNome ?? '—' },
      { titulo: 'Aprovação', render: (modelo) => ({ APPROVED: 'Aprovado', PENDING: 'Pendente', PENDING_APPROVAL: 'Aguardando aprovação', REJECTED: 'Rejeitado', DRAFT: 'Rascunho' }[modelo.aprovacao ?? ''] ?? 'Não informada') },
      {
        titulo: 'Vida útil',
        numerica: true,
        render: (modelo) => modelo.vidaUtilMeses === null ? 'Não informada' : `${modelo.vidaUtilMeses} meses`,
      },
      {
        titulo: modoDemonstracao ? 'Especificações' : 'Materiais',
        numerica: true,
        render: (modelo) => modoDemonstracao
          ? `${Object.keys(modelo.especificacoes).length} ${pluralizar(Object.keys(modelo.especificacoes).length, 'campo', 'campos')}`
          : modelo.materiais?.join(', ') || 'Não informados',
      },
    ],
    [modoDemonstracao],
  )

  return (
    <>
      <PageHeader
        titulo="Modelos"
        subtitulo="Especificações técnicas que os itens herdam no cadastro."
      />

      <div className={estilos.toolbar}>
        <CadastroCategoria aoConcluir={categorias.recarregar} />
        <SearchInput
          id="busca-modelos"
          rotulo="Pesquisar modelo por nome, fabricante ou categoria"
          valor={busca}
          aoMudar={setBusca}
          placeholder="Pesquisar por nome, fabricante ou categoria..."
        />
        {permitido && <Button variante="primario" onClick={abrir}>
          Adicionar modelo
        </Button>}
      </div>

      <section className={estilos.cartao} aria-labelledby="titulo-lista">
        <h2 className="titulo-card" id="titulo-lista">
          Todos os modelos {modelos.dados && `(${modelos.dados.length} modelos)`}
        </h2>

        {modelos.carregando && <Skeleton descricao="Carregando os modelos." linhas={4} />}
        {modelos.erro && <EstadoErro mensagem={modelos.erro} aoTentarNovamente={modelos.recarregar} />}

        {modelos.dados && visiveis.length === 0 && (
          <EmptyState
            titulo={busca ? 'Nenhum modelo com essa busca' : 'Nenhum modelo cadastrado'}
            descricao={
              busca
                ? 'Confira o termo digitado ou limpe a busca.'
                : 'Cadastre o primeiro modelo para padronizar as especificações dos itens.'
            }
          />
        )}

        {visiveis.length > 0 && (
          <DataTable
            colunas={colunas}
            dados={visiveis}
            chave={(modelo) => modelo.id}
            legenda="Modelos cadastrados com fabricante, categoria e vida útil"
          />
        )}
      </section>

      <section className={estilos.cartao} aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="titulo-card">Categorias</h2>
        {categorias.carregando && <Skeleton descricao="Carregando categorias." linhas={3} />}
        {categorias.erro && <EstadoErro mensagem={categorias.erro} aoTentarNovamente={categorias.recarregar} />}
        {categorias.dados?.filter((categoria) => normalizarBusca(`${categoria.nome} ${categoria.descricao}`).includes(normalizarBusca(busca))).map((categoria) => {
          const quantidade = modelos.dados?.filter((modelo) => modelo.categoriaId === categoria.id).length
          return <article key={categoria.id} className={estilos.categoria}>
            <h3>{categoria.nome}</h3><p>{categoria.descricao}</p>
            {quantidade !== undefined && <p>{quantidade ? `${quantidade} ${pluralizar(quantidade, 'modelo', 'modelos')}` : 'Nenhum modelo nesta categoria ainda'}</p>}
            {permitido && <Button onClick={() => { abrir(); alterar('categoriaId', String(categoria.id)) }}>Adicionar modelo</Button>}
          </article>
        })}
      </section>

      <CadastroModelo cadastro={cadastro} categorias={categorias} />

      <Toast mensagem={toast} />
    </>
  )
}
