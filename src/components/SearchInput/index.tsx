import type { SearchInputProps } from '../../types/componentes/SearchInput'
export type { SearchInputProps } from '../../types/componentes/SearchInput'
import { Search } from 'lucide-react'
import estilos from '../../../styles/components/SearchInput/SearchInput.module.css'

export function SearchInput({
  id,
  valor,
  aoMudar,
  rotulo,
  placeholder = 'Pesquisar por ID, Nome ou Material...',
  aoEnviar,
}: SearchInputProps) {
  const campo = (
    <span className={estilos.campo}>
      <Search size={18} aria-hidden="true" className={estilos.icone} />
      <label className="somente-leitor-de-tela" htmlFor={id}>
        {rotulo}
      </label>
      <input
        id={id}
        type="search"
        className={estilos.entrada}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        placeholder={placeholder}
        maxLength={60}
      />
    </span>
  )

  if (!aoEnviar) return campo

  return (
    <form
      className={estilos.formulario}
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault()
        aoEnviar()
      }}
    >
      {campo}
    </form>
  )
}
