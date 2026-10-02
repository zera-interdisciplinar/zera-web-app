import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import estilos from './Modal.module.css'

export interface ModalProps {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
  larguraMaxima?: number
}

const FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ aberto, titulo, aoFechar, children, larguraMaxima = 880 }: ModalProps) {
  const dialogoRef = useRef<HTMLDivElement | null>(null)
  const origemFocoRef = useRef<HTMLElement | null>(null)
  const fecharRef = useRef(aoFechar)
  useEffect(() => { fecharRef.current = aoFechar }, [aoFechar])

  const aoTeclar = useCallback(
    (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        fecharRef.current()
        return
      }

      if (evento.key !== 'Tab') return

      const dialogo = dialogoRef.current
      if (!dialogo) return

      const focaveis = Array.from(dialogo.querySelectorAll<HTMLElement>(FOCAVEIS)).filter((item) => item.getClientRects().length > 0)
      if (focaveis.length === 0) return

      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      const ativo = document.activeElement

      if (evento.shiftKey && (ativo === primeiro || ativo === dialogo)) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && (ativo === ultimo || ativo === dialogo)) {
        evento.preventDefault()
        primeiro.focus()
      }
    },
    [],
  )

  useEffect(() => {
    if (!aberto) return

    origemFocoRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const dialogo = dialogoRef.current
    const fundo: HTMLElement[] = []
    for (let ramo = dialogo?.parentElement; ramo && ramo.id !== 'root'; ramo = ramo.parentElement) {
      fundo.push(...Array.from(ramo.parentElement?.children ?? []).filter((item): item is HTMLElement => item instanceof HTMLElement && item !== ramo))
    }
    const anteriores = fundo.map((item) => item.inert)
    fundo.forEach((item) => { item.inert = true })
    const primeiroCampo = dialogo?.querySelector<HTMLElement>('input, select, textarea')
    const primeiroFocavel = dialogo?.querySelector<HTMLElement>(FOCAVEIS)
    ;(primeiroCampo ?? primeiroFocavel)?.focus()

    document.addEventListener('keydown', aoTeclar)

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      fundo.forEach((item, indice) => { item.inert = anteriores[indice] })
      origemFocoRef.current?.focus()
    }
  }, [aberto, aoTeclar])

  if (!aberto) return null

  return (
    <div className={estilos.veu}>
      <div
        className={estilos.modal}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        ref={dialogoRef}
        tabIndex={-1}
        style={{ maxWidth: larguraMaxima }}
      >
        <button
          type="button"
          className={estilos.fechar}
          onClick={aoFechar}
          aria-label={`Fechar: ${titulo}`}
        >
          <X size={24} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  )
}
