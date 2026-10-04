import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function AvisoNavegacao() {
  const { pathname } = useLocation()
  const anterior = useRef(pathname)

  useEffect(() => {
    const mudou = anterior.current !== pathname
    anterior.current = pathname
    const atualizar = () => {
      const conteudo = document.querySelector<HTMLElement>('main:not([data-carregando])')
      const titulo = conteudo?.querySelector('h1')?.textContent?.trim()
      if (!conteudo || !titulo) return false
      document.title = `${titulo} — Zera`
      if (mudou) conteudo.focus({ preventScroll: true })
      return true
    }
    if (atualizar()) return
    const observador = new MutationObserver(() => {
      if (atualizar()) observador.disconnect()
    })
    observador.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
    return () => observador.disconnect()
  }, [pathname])

  return null
}
