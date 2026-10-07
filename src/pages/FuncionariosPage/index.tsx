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
import { useRequisicao } from '../../hooks/useRequisicao'
import { useToast } from '../../hooks/useToast'
import { criarUsuario, listarUsuarios } from '../../services/usuarioService'
import { modoDemonstracao } from '../../services/apiReal'
import { mensagemDeErro } from '../../types/api'
import type { NovoUsuario, Perfil, Usuario } from '../../types/usuario'
import { ROTULO_PERFIL } from '../../types/usuario'
import { validarNovoUsuario } from '../../utils/validacao'
import type { ErrosDeCampo } from '../../utils/validacao'
import estilos from '../../../styles/pages/FuncionariosPage/FuncionariosPage.module.css'

interface FormFuncionario {
  nome: string
  email: string
  perfil: string
  unidade: string
}

const FORM_INICIAL: FormFuncionario = { nome: '', email: '', perfil: '', unidade: '' }

export default function FuncionariosPage() {
  const buscar = useCallback((sinal: AbortSignal) => listarUsuarios(sinal), [])
  const usuarios = useRequisicao<Usuario[]>(buscar)
  const [toast, mostrarToast] = useToast()

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<FormFuncionario>(FORM_INICIAL)
  const [erros, setErros] = useState<ErrosDeCampo<NovoUsuario>>({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const visiveis = useMemo<Usuario[]>(() => {
    const dados = usuarios.dados ?? []
    const termo = busca.trim().toLowerCase()
    if (termo.length === 0) return dados
    return dados.filter(
      (pessoa) =>
        pessoa.nome.toLowerCase().includes(termo) ||
        pessoa.email.toLowerCase().includes(termo) ||
        pessoa.unidade.toLowerCase().includes(termo),
    )
  }, [usuarios.dados, busca])

  const colunas = useMemo<Coluna<Usuario>[]>(
    () => [
      { titulo: 'Nome', render: (pessoa) => pessoa.nome },
      {
        titulo: 'E-mail',
        render: (pessoa) => <span className="texto-mono">{pessoa.email}</span>,
      },
      { titulo: 'Perfil', render: (pessoa) => ROTULO_PERFIL[pessoa.perfil] },
      { titulo: 'Unidade', render: (pessoa) => pessoa.unidade },
    ],
    [],
  )

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroEnvio(null)

    const candidato: NovoUsuario = {
      nome: form.nome,
      email: form.email,
      perfil: form.perfil as Perfil,
      unidade: form.unidade,
    }

    const validacao = validarNovoUsuario(candidato)
    setErros(validacao.erros)
    if (!validacao.valido) return

    setEnviando(true)
    try {
      await criarUsuario(validacao.dados)
      mostrarToast(`${validacao.dados.nome} cadastrado como ${ROTULO_PERFIL[validacao.dados.perfil].toLowerCase()}.`)
      setModalAberto(false)
      setForm(FORM_INICIAL)
      usuarios.recarregar()
    } catch (falha) {
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <PageHeader
        titulo="Funcionários"
        subtitulo="Acessos ao sistema por perfil."
      />

      <div className={estilos.toolbar}>
        <SearchInput
          id="busca-funcionarios"
          rotulo="Pesquisar funcionário por nome, e-mail ou unidade"
          valor={busca}
          aoMudar={setBusca}
          placeholder="Pesquisar por nome, e-mail ou unidade..."
        />
        {modoDemonstracao && <Button variante="primario" onClick={() => setModalAberto(true)}>
          Adicionar funcionário
        </Button>}
      </div>

      <section className={estilos.cartao} aria-labelledby="titulo-lista">
        <h2 className="titulo-card" id="titulo-lista">
          Todos os funcionários
        </h2>

        {usuarios.carregando && <Skeleton descricao="Carregando os funcionários." linhas={3} />}
        {usuarios.erro && (
          <EstadoErro mensagem={usuarios.erro} aoTentarNovamente={usuarios.recarregar} />
        )}

        {usuarios.dados && visiveis.length === 0 && (
          <EmptyState
            titulo={busca ? 'Nenhum funcionário com essa busca' : 'Nenhum funcionário cadastrado'}
            descricao={
              busca
                ? 'Confira o termo digitado ou limpe a busca.'
                : 'Cadastre o primeiro acesso para a equipe operar o Zera.'
            }
          />
        )}

        {visiveis.length > 0 && (
          <DataTable
            colunas={colunas}
            dados={visiveis}
            chave={(pessoa) => pessoa.id}
            legenda="Funcionários com acesso ao sistema"
          />
        )}
      </section>

      <Modal
        aberto={modalAberto}
        titulo="Adicionar funcionário"
        aoFechar={() => setModalAberto(false)}
      >
        <form onSubmit={aoSalvar} noValidate>
          <div className={estilos.camposModal}>
            <FieldCard
              id="funcionario-nome"
              rotulo="Nome"
              valor={form.nome}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, nome: valor }))}
              erro={erros.nome}
              placeholder="Nome completo"
              maxLength={80}
              desabilitado={enviando}
            />
            <FieldCard
              id="funcionario-email"
              rotulo="E-mail"
              tipo="email"
              valor={form.email}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, email: valor }))}
              erro={erros.email}
              placeholder="nome@empresa.com"
              maxLength={120}
              desabilitado={enviando}
            />
            <FieldCard
              id="funcionario-perfil"
              rotulo="Perfil"
              tipo="select"
              valor={form.perfil}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, perfil: valor }))}
              erro={erros.perfil}
              desabilitado={enviando}
              opcoes={[
                { valor: '', rotulo: 'Selecione o perfil de acesso' },
                { valor: 'funcionario', rotulo: ROTULO_PERFIL.funcionario },
                { valor: 'gestor', rotulo: ROTULO_PERFIL.gestor },
                { valor: 'administrador', rotulo: ROTULO_PERFIL.administrador },
              ]}
            />
            <FieldCard
              id="funcionario-unidade"
              rotulo="Unidade"
              valor={form.unidade}
              aoMudar={(valor) => setForm((atual) => ({ ...atual, unidade: valor }))}
              erro={erros.unidade}
              placeholder="Ex: Almoxarifado central"
              maxLength={60}
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
