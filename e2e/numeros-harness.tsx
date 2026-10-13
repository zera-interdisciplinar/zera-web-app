import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FieldCard } from '../src/components/FieldCard'
import '../styles/global.css'

const campos = ['modelo-vida-util', 'modelo-garantia', 'modelo-peso', 'capacidade', 'dias-lote-critico', 'meta']
function Amostra() {
  const [valores, setValores] = useState<Record<string, string>>({})
  return <main>{campos.map(id => <FieldCard key={id} id={id} rotulo={id} tipo="numero" valor={valores[id] ?? ''} aoMudar={valor => setValores(atual => ({ ...atual, [id]: valor }))} />)}</main>
}
const raiz = document.getElementById('root')
if (!raiz) throw new Error('Raiz ausente')
createRoot(raiz).render(<Amostra />)
