import type { EdicaoItemRealProps } from '../../types/componentes/EdicaoItemReal'
export type { EdicaoItemRealProps } from '../../types/componentes/EdicaoItemReal'

import { useEdicaoItem } from '../../hooks/useEdicaoItem'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Modal } from '../Modal'

const OPCOES_CONDICAO = [
  { valor: 'NEW', rotulo: 'Novo' },
  { valor: 'USED', rotulo: 'Usado' },
  { valor: 'SEMI_DAMAGED', rotulo: 'Semidanificado' },
  { valor: 'DAMAGED', rotulo: 'Danificado' },
]

export function EdicaoItemReal({ item, aoConcluir }: EdicaoItemRealProps) {
  const edicao = useEdicaoItem(item, aoConcluir)
  return <>
    <Button onClick={edicao.abrir}>Editar item</Button>
    <p role="status">{edicao.sucesso}</p>
    <Modal aberto={edicao.aberto} titulo="Editar item" aoFechar={edicao.fechar}>
      <form onSubmit={edicao.salvar} noValidate>
        <FieldCard id="api-item-nome" rotulo="Nome" valor={edicao.form.name} aoMudar={(valor) => edicao.alterar('name', valor)} maxLength={120} desabilitado={edicao.enviando} erro={edicao.erros.name} />
        <FieldCard id="api-item-condicao" rotulo="Condição" tipo="select" valor={edicao.form.condition} aoMudar={(valor) => edicao.alterar('condition', valor)} opcoes={OPCOES_CONDICAO} desabilitado={edicao.enviando} erro={edicao.erros.condition} />
        <p>Deixe as observações em branco para manter o texto já cadastrado.</p>
        <FieldCard id="api-item-notas" rotulo="Novas observações" tipo="textarea" valor={edicao.form.notes} aoMudar={(valor) => edicao.alterar('notes', valor)} maxLength={500} desabilitado={edicao.enviando} erro={edicao.erros.notes} />
        {edicao.erro && <p role="alert">{edicao.erro}</p>}
        <p role="status">{edicao.enviando ? 'Salvando item…' : ''}</p>
        <Button type="submit" disabled={edicao.enviando}>Salvar alterações</Button>
      </form>
    </Modal>
  </>
}
