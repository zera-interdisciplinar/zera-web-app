import { useCallback, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import type { Coluna } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useCategorias } from '../../hooks/useCategorias'
import { useRequisicao } from '../../hooks/useRequisicao'
import { useToast } from '../../hooks/useToast'
import { criarModelo, listarModelos } from '../../services/modeloService'
import { modoDemonstracao } from '../../services/apiReal'
import { mensagemDeErro } from '../../types/api'
import type { Modelo, NovoModelo } from '../../types/modelo'
import { pluralizar } from '../../utils/formatacao'
import { validarNovoModelo } from '../../utils/validacao'
import type { ErrosDeCampo } from '../../utils/validacao'
import estilos from './ModelosPage.module.css'
import { CadastroCategoria } from '../../components/CadastroCategoria'

interface FormModelo {
  nome: string
  fabricante: string
  categoriaId: string
  vidaUtilMeses: string
  especificacoes: string
}

const FORM_INICIAL: FormModelo = {
  nome: '',
  fabricante: '',
  categoriaId: '',
  vidaUtilMeses: '',
  especificacoes: '',
}

function interpretarEspecificacoes(texto: string): Record<string, string> {
  const especificacoes: Record<string, string> = {}
  for (const linha of texto.split('\n')) {
    const corte = linha.indexOf(':')
    if (corte <= 0) continue
    const chave = linha.slice(0, corte).trim()
    const valor = linha.slice(corte + 1).trim()
    if (chave && valor) especificacoes[chave] = valor
  }
  return especificacoes
}

export default function ModelosPage() {
  const buscarModelos = useCallback((sinal: AbortSignal) => listarModelos(sinal), [])
  const modelos = useRequisicao<Modelo[]>(buscarModelos)
  const categorias = useCategorias()
  const [toast, mostrarToast] = useToast()

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<FormModelo>(FORM_INICIAL)
  const [erros, setErros] = useState<ErrosDeCampo<NovoModelo>>({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const visiveis = useMemo<Modelo[]>(() => {
    const dados = modelos.dados ?? []
    const termo = busca.trim().toLowerCase()
    if (termo.length === 0) return dados
    return dados.filter(
      (modelo) =>
        modelo.nome.toLowerCase().includes(termo) ||
        modelo.fabricante.toLowerCase().includes(termo) ||
        (modelo.categoriaNome ?? '').toLowerCase().includes(termo),
    )
  }, [modelos.dados, busca])

  const colunas = useMemo<Coluna<Modelo>[]>(
    () => [
      { titulo: 'Modelo', render: (modelo) => modelo.nome },
      { titulo: 'Fabricante', render: (modelo) => modelo.fabricante },
      { titulo: 'Categoria', render: (modelo) => modelo.categoriaNome ?? '—' },
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
    [],
  )

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroEnvio(null)

    const candidato: NovoModelo = {
      nome: form.nome,
      fabricante: form.fabricante,
      categoriaId: Number(form.categoriaId),
      vidaUtilMeses: Number(form.vidaUtilMeses),
      especificacoes: interpretarEspecificacoes(form.especificacoes),
    }

    const validacao = validarNovoModelo(candidato)
    setErros(validacao.erros)
    if (!validacao.valido) return

    setEnviando(true)
    try {
      await criarModelo(validacao.dados)
      mostrarToast(`Modelo "${validacao.dados.nome}" cadastrado.`)
      setModalAberto(false)
      setForm(FORM_INICIAL)
      modelos.recarregar()
    } catch (falha) {
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }

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
        {modoDemonstracao && <Button variante="primario" onClick={() => setModalAberto(true)}>
          Adicionar modelo
        </Button>}
      </div>

      <section className={estilos.cartao} aria-labelledby="titulo-lista">
        <h2 className="titulo-card" id="titulo-lista">
          Todos os modelos
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

      <Modal aberto={modalAberto} titulo="Adicionar modelo" aoFechar={() => setModalAberto(false)}>
        <form onSubmit={aoSalvar} noValidate>
          <div className={estilos.camposModal}>
            <FieldCard
              id="modelo-nome"
              rotulo="Modelo"
              valor={form.nome}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, nome: valor }))}
              erro={erros.nome}
              placeholder="Ex: Inspiron 15 3000"
              maxLength={80}
              desabilitado={enviando}
            />
            <FieldCard
              id="modelo-fabricante"
              rotulo="Fabricante"
              valor={form.fabricante}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, fabricante: valor }))}
              erro={erros.fabricante}
              placeholder="Ex: Dell"
              maxLength={60}
              desabilitado={enviando}
            />
            <FieldCard
              id="modelo-categoria"
              rotulo="Categoria"
              tipo="select"
              valor={form.categoriaId}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, categoriaId: valor }))}
              erro={erros.categoriaId}
              desabilitado={enviando}
              opcoes={[
                { valor: '', rotulo: 'Selecione uma categoria' },
                ...(categorias.dados ?? []).map((categoria) => ({
                  valor: String(categoria.id),
                  rotulo: categoria.nome,
                })),
              ]}
            />
            <FieldCard
              id="modelo-vida-util"
              rotulo="Vida útil (meses)"
              tipo="numero"
              valor={form.vidaUtilMeses}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, vidaUtilMeses: valor }))}
              erro={erros.vidaUtilMeses}
              placeholder="Ex: 60"
              desabilitado={enviando}
            />
            <FieldCard
              id="modelo-especificacoes"
              rotulo="Especificações"
              tipo="textarea"
              valor={form.especificacoes}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, especificacoes: valor }))}
              placeholder={'Uma por linha, no formato Chave: valor\nEx: Memória: 8 GB DDR4'}
              desabilitado={enviando}
            />
          </div>

          {erroEnvio && (
            <p className={estilos.erroModal} role="alert">
              {erroEnvio}
            </p>
          )}

          <div className={estilos.acoesModal}>
            <Button variante="navy" tamanho="grande" type="submit" disabled={enviando}>
              {enviando ? 'Salvando…' : 'Concluir cadastro'}
            </Button>
            <Button
              variante="secundario"
              tamanho="grande"
              onClick={() => setModalAberto(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Toast mensagem={toast} />
    </>
  )
}
