import { useMemo } from 'react'
import estilos from '../../../styles/pages/RecicladorasPage/RecicladorasPage.module.css'
import { useAmbiente } from '../../hooks/useAmbiente'
import { useCadastroRecicladoras } from '../../hooks/useCadastroRecicladoras'
import type { Recicladora } from '../../types/relatorio'
import { Button } from '../Button'
import type { Coluna } from '../DataTable'
import { DataTable } from '../DataTable'
import { EmptyState } from '../EmptyState'
import { EstadoErro } from '../EstadoErro'
import { FieldCard } from '../FieldCard'
import { Formulario } from '../Formulario'
import { Modal } from '../Modal'
import { PageHeader } from '../PageHeader'
import { SearchInput } from '../SearchInput'
import { Skeleton } from '../Skeleton'
import { Toast } from '../Toast'

export function CadastroRecicladoras() {
  const { modoDemonstracao } = useAmbiente()
  const {
    gerirEstoque,
    recicladoras,
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
  } = useCadastroRecicladoras()

  // Preserva as definições da tabela enquanto o formulário é atualizado.
  const colunas = useMemo<Coluna<Recicladora>[]>(
    () => [
      { titulo: 'Nome', render: (recicladora) => recicladora.nome },
      {
        titulo: 'CNPJ',
        render: (recicladora) => <span className="texto-mono">{recicladora.cnpj}</span>,
      },
      { titulo: modoDemonstracao ? 'Cidade' : 'E-mail', render: (recicladora) => modoDemonstracao ? recicladora.cidade : recicladora.email ?? 'Não informado' },
    ],
    [modoDemonstracao],
  )

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
