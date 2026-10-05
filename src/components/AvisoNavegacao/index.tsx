import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function AvisoNavegacao() {
  const { pathname } = useLocation()
  const anterior = useRef(pathname)

  useEffect(() => {
    const mudou = anterior.current !== pathname
    anterior.current = pathname
    let ultimoTitulo: Element | null = null
    let ultimoTexto = ''
    const atualizar = () => {
      const conteudo = document.querySelector<HTMLElement>('main:not([data-carregando])')
      const elementoTitulo = conteudo?.querySelector('h1')
      const titulo = elementoTitulo?.textContent?.trim()
      if (!conteudo || !titulo) return false
      if (ultimoTitulo === elementoTitulo && ultimoTexto === titulo) return true
      ultimoTitulo = elementoTitulo ?? null
      ultimoTexto = titulo
      document.title = `${titulo} — Zera`
      if (mudou) conteudo.focus({ preventScroll: true })
      return true
    }
    atualizar()
    const observador = new MutationObserver(() => {
      atualizar()
    })
    observador.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
    return () => observador.disconnect()
  }, [pathname])

  return null
}
