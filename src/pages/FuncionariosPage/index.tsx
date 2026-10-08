import { useMemo } from 'react'
import estilos from '../../../styles/pages/FuncionariosPage/FuncionariosPage.module.css'
import { Button } from '../../components/Button'
import type { Coluna } from '../../components/DataTable'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { Formulario } from '../../components/Formulario'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useAmbiente } from '../../hooks/useAmbiente'
import { useFuncionarios } from '../../hooks/useFuncionarios'
import type { Usuario } from '../../types/usuario'
import { ROTULO_PERFIL } from '../../types/usuario'

export default function FuncionariosPage() {
  const { modoDemonstracao } = useAmbiente()
  const {
    usuarios,
    toast,
    busca,
    setBusca,
    modalAberto,
    setModalAberto,
    form,
    setForm,
    erros,
    setErros,
    enviando,
    erroEnvio,
    visiveis,
    aoSalvar,
  } = useFuncionarios()

  // Preserva as definições da tabela enquanto o formulário é atualizado.
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
        <Formulario onSubmit={aoSalvar} noValidate>
          <div className={estilos.camposModal}>
            <FieldCard
              id="funcionario-nome" obrigatorio
              rotulo="Nome"
              valor={form.nome}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, nome: valor })); setErros((atual) => ({ ...atual, nome: undefined })) }}
              erro={erros.nome}
              placeholder="Nome completo"
              maxLength={80}
              desabilitado={enviando}
            />
            <FieldCard
              id="funcionario-email" obrigatorio
              rotulo="E-mail"
              tipo="email"
              valor={form.email}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, email: valor })); setErros((atual) => ({ ...atual, email: undefined })) }}
              erro={erros.email}
              placeholder="nome@empresa.com"
              maxLength={120}
              desabilitado={enviando}
            />
            <FieldCard
              id="funcionario-perfil" obrigatorio
              rotulo="Perfil"
              tipo="select"
              valor={form.perfil}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, perfil: valor })); setErros((atual) => ({ ...atual, perfil: undefined })) }}
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
              id="funcionario-unidade" obrigatorio
              rotulo="Unidade"
              valor={form.unidade}
              aoMudar={(valor) => { setForm((atual) => ({ ...atual, unidade: valor })); setErros((atual) => ({ ...atual, unidade: undefined })) }}
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
        </Formulario>
      </Modal>

      <Toast mensagem={toast} />
    </>
  )
}
