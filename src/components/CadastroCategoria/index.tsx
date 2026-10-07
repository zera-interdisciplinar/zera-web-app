import type { CadastroCategoriaProps } from '../../types/componentes/CadastroCategoria'
export type { CadastroCategoriaProps } from '../../types/componentes/CadastroCategoria'
import { useCadastroCategoria } from '../../hooks/useCadastroCategoria'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Modal } from '../Modal'

export function CadastroCategoria({ aoConcluir }: CadastroCategoriaProps) {
  const cadastro = useCadastroCategoria(aoConcluir)
  if (!cadastro.permitido) return null

  return <div>
    <Button variante="secundario" onClick={cadastro.abrir}>Adicionar categoria</Button>
    <p role="status">{cadastro.sucesso}</p>
    <Modal aberto={cadastro.aberto} titulo="Adicionar categoria" aoFechar={cadastro.fechar}>
      <form onSubmit={cadastro.salvar} noValidate>
        <FieldCard id="categoria-nome" rotulo="Nome" valor={cadastro.form.nome} aoMudar={(valor) => cadastro.alterar('nome', valor)} maxLength={80} desabilitado={cadastro.enviando} erro={cadastro.erros.nome} />
        <FieldCard id="categoria-descricao" rotulo="Descrição" tipo="textarea" valor={cadastro.form.descricao} aoMudar={(valor) => cadastro.alterar('descricao', valor)} maxLength={255} desabilitado={cadastro.enviando} erro={cadastro.erros.descricao} />
        {cadastro.erro && <p role="alert">{cadastro.erro}</p>}
        <p role="status">{cadastro.enviando ? 'Salvando categoria…' : ''}</p>
        <Button type="submit" disabled={cadastro.enviando}>Salvar categoria</Button>
      </form>
    </Modal>
  </div>
}
