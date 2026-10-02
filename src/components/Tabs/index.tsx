import { useRef } from 'react'
import estilos from './Tabs.module.css'

export interface DefinicaoAba {
  id: string
  rotulo: string
}

export interface TabsProps {
  abas: DefinicaoAba[]
  ativa: string
  aoSelecionar: (id: string) => void
  rotuloLista: string
}

export function Tabs({ abas, ativa, aoSelecionar, rotuloLista }: TabsProps) {
  const listaRef = useRef<HTMLDivElement | null>(null)

  function aoTeclar(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    const ultimo = abas.length - 1
    let destino: number | null = null

    if (evento.key === 'ArrowRight') destino = indice === ultimo ? 0 : indice + 1
    if (evento.key === 'ArrowLeft') destino = indice === 0 ? ultimo : indice - 1
    if (evento.key === 'Home') destino = 0
    if (evento.key === 'End') destino = ultimo
    if (destino === null) return

    evento.preventDefault()
    const proxima = abas[destino]
    aoSelecionar(proxima.id)
    listaRef.current?.querySelector<HTMLButtonElement>(`#aba-${proxima.id}`)?.focus()
  }

  return (
    <div className={estilos.lista} role="tablist" aria-label={rotuloLista} ref={listaRef}>
      {abas.map((aba, indice) => {
        const selecionada = aba.id === ativa
        return (
          <button
            key={aba.id}
            id={`aba-${aba.id}`}
            type="button"
            role="tab"
            className={`${estilos.aba} ${selecionada ? estilos.ativa : ''}`}
            aria-selected={selecionada}
            aria-controls={`painel-${aba.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => aoSelecionar(aba.id)}
            onKeyDown={(evento) => aoTeclar(evento, indice)}
          >
            {aba.rotulo}
          </button>
        )
      })}
    </div>
  )
}
