import { useCallback, useEffect, useRef, useState } from 'react'

export function useMenuSuspenso() {
  const [aberto, setAberto] = useState(false)
  const gatilhoRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)

  const alternar = useCallback(() => setAberto((valor) => !valor), [])
  const fechar = useCallback(() => setAberto(false), [])
  const fecharDevolvendoFoco = useCallback(() => {
    setAberto(false)
    gatilhoRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!aberto) return

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target
      if (!(alvo instanceof Node)) return
      if (menuRef.current?.contains(alvo) || gatilhoRef.current?.contains(alvo)) return
      setAberto(false)
    }

    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  useEffect(() => {
    if (!aberto || !menuRef.current) return
    const selecionado =
      menuRef.current.querySelector<HTMLElement>('[aria-checked="true"]') ??
      menuRef.current.querySelector<HTMLElement>('[role="menuitemradio"], [role="menuitem"]')
    selecionado?.focus()
  }, [aberto])

  const aoTeclarMenu = useCallback(
    (evento: React.KeyboardEvent) => {
      const itens = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitem"]') ?? [],
      )
      if (itens.length === 0) return
      const indice = itens.indexOf(document.activeElement as HTMLElement)

      if (evento.key === 'Escape') {
        evento.preventDefault()
        fecharDevolvendoFoco()
      } else if (evento.key === 'ArrowDown') {
        evento.preventDefault()
        itens[(indice + 1) % itens.length].focus()
      } else if (evento.key === 'ArrowUp') {
        evento.preventDefault()
        itens[(indice - 1 + itens.length) % itens.length].focus()
      } else if (evento.key === 'Home') {
        evento.preventDefault()
        itens[0].focus()
      } else if (evento.key === 'End') {
        evento.preventDefault()
        itens[itens.length - 1].focus()
      } else if (evento.key === 'Tab') {
        setAberto(false)
      }
    },
    [fecharDevolvendoFoco],
  )

  return { aberto, gatilhoRef, menuRef, alternar, fechar, fecharDevolvendoFoco, aoTeclarMenu }
}
