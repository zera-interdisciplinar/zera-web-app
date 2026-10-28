import { Formulario } from '../../components/Formulario'
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
import { LocaisReciclagem } from '../../components/LocaisReciclagem'
import { useRequisicao } from '../../hooks/useRequisicao'
import { useToast } from '../../hooks/useToast'
import { criarRecicladora, listarRecicladoras } from '../../services/relatorioService'
import { modoDemonstracao } from '../../services/apiReal'
import { mensagemDeErro } from '../../types/api'
import type { NovaRecicladora, Recicladora } from '../../types/relatorio'
import { validarNovaRecicladora } from '../../utils/validacao'
import type { ErrosDeCampo } from '../../utils/validacao'
import estilos from '../../../styles/pages/RecicladorasPage/RecicladorasPage.module.css'
import { usePermissoes } from '../../hooks/usePermissoes'
import { normalizarBusca } from '../../utils/busca'

const FORM_INICIAL: NovaRecicladora = { nome: '', cnpj: '', cidade: '', email: '' }

export default function RecicladorasPage() {
  if (!modoDemonstracao) return <>
    <PageHeader titulo="Locais de reciclagem" subtitulo="Consulte pontos próximos para planejar o destino dos itens." />
    <LocaisReciclagem />
    <CadastroRecicladoras />
  </>
  return <CadastroRecicladoras />
}

function CadastroRecicladoras() {
  const { gerirEstoque } = usePermissoes()
  const buscar = useCallback((sinal: AbortSignal) => listarRecicladoras(sinal), [])
  const recicladoras = useRequisicao<Recicladora[]>(buscar)
  const [toast, mostrarToast] = useToast()

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<NovaRecicladora>(FORM_INICIAL)
  const [erros, setErros] = useState<ErrosDeCampo<NovaRecicladora>>({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const visiveis = useMemo<Recicladora[]>(() => {
    const dados = recicladoras.dados ?? []
    const termo = normalizarBusca(busca)
    if (termo.length === 0) return dados
    return dados.filter(
      (recicladora) =>
        normalizarBusca(recicladora.nome).includes(termo) ||
        normalizarBusca(recicladora.email ?? recicladora.cidade).includes(termo) ||
        recicladora.cnpj.includes(termo),
    )
  }, [recicladoras.dados, busca])

  const colunas = useMemo<Coluna<Recicladora>[]>(
    () => [
      { titulo: 'Nome', render: (recicladora) => recicladora.nome },
      {
        titulo: 'CNPJ',
        render: (recicladora) => <span className="texto-mono">{recicladora.cnpj}</span>,
      },
      { titulo: modoDemonstracao ? 'Cidade' : 'E-mail', render: (recicladora) => modoDemonstracao ? recicladora.cidade : recicladora.email ?? 'Não informado' },
    ],
    [],
  )

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando || !gerirEstoque) return
    setErroEnvio(null)

    const validacao = validarNovaRecicladora(form, !modoDemonstracao)
    setErros(validacao.erros)
    if (!validacao.valido) return

    setEnviando(true)
    try {
      await criarRecicladora(validacao.dados)
      mostrarToast(`Cooperativa "${validacao.dados.nome}" cadastrada.`)
      setModalAberto(false)
      setForm(FORM_INICIAL)
      recicladoras.recarregar()
    } catch (falha) {
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      {modoDemonstracao ? <PageHeader
        titulo="Recicladoras"
        subtitulo="Cooperativas que recebem os lotes de descarte."
      /> : <h2 className="titulo-card">Recicladoras cadastradas</h2>}

      <div className={estilos.toolbar}>
        <SearchInput
          id="busca-recicladoras"
          rotulo={modoDemonstracao ? 'Pesquisar cooperativa por nome, cidade ou CNPJ' : 'Pesquisar cooperativa por nome, e-mail ou CNPJ'}
          valor={busca}
          aoMudar={setBusca}
          placeholder={modoDemonstracao ? 'Pesquisar por nome, cidade ou CNPJ...' : 'Pesquisar por nome, e-mail ou CNPJ...'}
        />
        {gerirEstoque && <Button variante="primario" onClick={() => setModalAberto(true)}>
          Adicionar recicladora
        </Button>}
      </div>

      <section className={estilos.cartao} aria-labelledby="titulo-lista">
        <h2 className="titulo-card" id="titulo-lista">
          Todas as recicladoras
        </h2>

        {recicladoras.carregando && <Skeleton descricao="Carregando as cooperativas." linhas={3} />}
        {recicladoras.erro && (
          <EstadoErro mensagem={recicladoras.erro} aoTentarNovamente={recicladoras.recarregar} />
        )}

        {recicladoras.dados && visiveis.length === 0 && (
          <EmptyState
            titulo={busca ? 'Nenhuma cooperativa com essa busca' : 'Nenhuma cooperativa cadastrada'}
            descricao={
              busca
                ? 'Confira o termo digitado ou limpe a busca.'
                : gerirEstoque ? 'Cadastre uma recicladora para manter os contatos da equipe.' : 'Nenhuma recicladora foi cadastrada ainda.'
            }
          />
        )}

        {visiveis.length > 0 && (
          <DataTable
            colunas={colunas}
            dados={visiveis}
            chave={(recicladora) => recicladora.id}
            legenda="Cooperativas e recicladoras cadastradas"
          />
        )}
      </section>

      <Modal
        aberto={modalAberto}
        titulo="Adicionar recicladora"
        aoFechar={() => setModalAberto(false)}
      >
        <Formulario onSubmit={aoSalvar} noValidate>
          <div className={estilos.camposModal}>
            <FieldCard
              id="recicladora-nome" obrigatorio
              rotulo="Nome"
              valor={form.nome}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, nome: valor })); setErros((atual) => ({ ...atual, nome: undefined })) }}
              erro={erros.nome}
              placeholder="Ex: Cooperativa Recicla Vale"
              maxLength={80}
              desabilitado={enviando}
            />
            <FieldCard
              id="recicladora-cnpj" obrigatorio
              rotulo="CNPJ"
              valor={form.cnpj}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, cnpj: valor })); setErros((atual) => ({ ...atual, cnpj: undefined })) }}
              erro={erros.cnpj}
              placeholder="12.345.678/0001-90"
              maxLength={18}
              desabilitado={enviando}
            />
            {modoDemonstracao ? <FieldCard
              id="recicladora-cidade" obrigatorio
              rotulo="Cidade"
              valor={form.cidade}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, cidade: valor })); setErros((atual) => ({ ...atual, cidade: undefined })) }}
              erro={erros.cidade}
              placeholder="Ex: Lins — SP"
              maxLength={60}
              desabilitado={enviando}
            /> : <FieldCard
              id="recicladora-email" obrigatorio
              rotulo="E-mail"
              tipo="email"
              valor={form.email ?? ''}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, email: valor })); setErros((atual) => ({ ...atual, email: undefined })) }}
              erro={erros.email}
              placeholder="contato@recicladora.com.br"
              maxLength={120}
              desabilitado={enviando}
            />}
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
        </Formulario>
      </Modal>

      <Toast mensagem={toast} />
    </>
  )
}
