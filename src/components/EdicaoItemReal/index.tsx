import { useState } from 'react'
import type { ProdutoDetalhado } from '../../types/produto'
import type { UpdateItemRequest } from '../../types/apiReal'
import { editarItemReal } from '../../services/produtoService'
import { sanitizarTexto } from '../../utils/sanitizacao'
import { mensagemDeErro } from '../../types/api'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Modal } from '../Modal'

export function EdicaoItemReal({ item, aoConcluir }: { item: ProdutoDetalhado; aoConcluir: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState<UpdateItemRequest>({ name: item.nome, condition: 'USED', notes: '' })
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    const dados = { ...form, name: sanitizarTexto(form.name), notes: sanitizarTexto(form.notes) }
    if (!dados.name || dados.name.length > 120 || dados.notes.length > 500) { setErro('Informe um nome com até 120 caracteres e observações com até 500.'); return }
    setEnviando(true)
    setErro(null)
    try {
      await editarItemReal(item.id, dados)
      setAberto(false)
      setSucesso('Item atualizado.')
      aoConcluir()
    } catch (falha) { setErro(mensagemDeErro(falha)) }
    finally { setEnviando(false) }
  }
  return <>
    <Button onClick={() => {
      const condicoes: Record<string, UpdateItemRequest['condition']> = { novo: 'NEW', usado: 'USED', semidanificado: 'SEMI_DAMAGED', danificado: 'DAMAGED' }
      setForm({ name: item.nome, condition: condicoes[item.condicao] ?? 'USED', notes: '' })
      setErro(null)
      setAberto(true)
    }}>Editar item</Button>
    <p role="status">{sucesso}</p>
    <Modal aberto={aberto} titulo="Editar item" aoFechar={() => { if (!enviando) setAberto(false) }}>
      <form onSubmit={salvar} noValidate>
        <FieldCard id="api-item-nome" rotulo="Nome" valor={form.name} aoMudar={(name) => setForm((atual) => ({ ...atual, name }))} maxLength={120} desabilitado={enviando} />
        <FieldCard id="api-item-condicao" rotulo="Condição" tipo="select" valor={form.condition} aoMudar={(condition) => setForm((atual) => ({ ...atual, condition: condition as UpdateItemRequest['condition'] }))} opcoes={[{ valor: 'NEW', rotulo: 'Novo' }, { valor: 'USED', rotulo: 'Usado' }, { valor: 'SEMI_DAMAGED', rotulo: 'Semidanificado' }, { valor: 'DAMAGED', rotulo: 'Danificado' }]} desabilitado={enviando} />
        <p>As observações anteriores não são retornadas nesta ficha. Deixe o campo vazio para preservá-las.</p>
        <FieldCard id="api-item-notas" rotulo="Novas observações" tipo="textarea" valor={form.notes} aoMudar={(notes) => setForm((atual) => ({ ...atual, notes }))} maxLength={500} desabilitado={enviando} />
        {erro && <p role="alert">{erro}</p>}
        <p role="status">{enviando ? 'Salvando item…' : ''}</p>
        <Button type="submit" disabled={enviando}>Salvar alterações</Button>
      </form>
    </Modal>
  </>
}
