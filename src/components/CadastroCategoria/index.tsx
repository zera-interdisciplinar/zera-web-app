import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { criarCategoria } from '../../services/categoriaService'
import { mensagemDeErro } from '../../types/api'
import { sanitizarTexto } from '../../utils/sanitizacao'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Modal } from '../Modal'

export function CadastroCategoria({ aoConcluir }: { aoConcluir: () => void }) {
  const { temPerfil } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState('')
  if (!temPerfil(['gestor', 'administrador'])) return null

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    const nome = sanitizarTexto(form.nome)
    const descricao = sanitizarTexto(form.descricao)
    if (!nome || !descricao) { setErro('Informe nome e descrição da categoria.'); return }
    setEnviando(true)
    setErro(null)
    try {
      await criarCategoria({ nome, descricao, diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })
      setSucesso(`Categoria ${nome} cadastrada.`)
      setAberto(false)
      setForm({ nome: '', descricao: '' })
      aoConcluir()
    } catch (falha) { setErro(mensagemDeErro(falha)) }
    finally { setEnviando(false) }
  }

  return <div>
    <Button variante="secundario" onClick={() => { setErro(null); setAberto(true) }}>Adicionar categoria</Button>
    <p role="status">{sucesso}</p>
    <Modal aberto={aberto} titulo="Adicionar categoria" aoFechar={() => { if (!enviando) setAberto(false) }}>
      <form onSubmit={salvar} noValidate>
        <FieldCard id="categoria-nome" rotulo="Nome" valor={form.nome} aoMudar={(nome) => setForm((atual) => ({ ...atual, nome }))} maxLength={80} desabilitado={enviando} />
        <FieldCard id="categoria-descricao" rotulo="Descrição" tipo="textarea" valor={form.descricao} aoMudar={(descricao) => setForm((atual) => ({ ...atual, descricao }))} maxLength={255} desabilitado={enviando} />
        {erro && <p role="alert">{erro}</p>}
        <p role="status">{enviando ? 'Salvando categoria…' : ''}</p>
        <Button type="submit" disabled={enviando}>Salvar categoria</Button>
      </form>
    </Modal>
  </div>
}
