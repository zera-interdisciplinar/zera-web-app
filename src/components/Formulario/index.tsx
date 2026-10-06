import { useRef, useState } from 'react'
import type { ComponentProps, SubmitEvent } from 'react'

export function Formulario({ onSubmit, onInput, children, ...props }: ComponentProps<'form'>) {
  const ref = useRef<HTMLFormElement>(null)
  const [campos, setCampos] = useState<string[]>([])
  function atualizar(focar: boolean) {
    requestAnimationFrame(() => {
      const invalidos = Array.from(ref.current?.querySelectorAll<HTMLElement>('[aria-invalid="true"]') ?? [])
      setCampos(invalidos.map((campo) => (campo.querySelector('legend')?.textContent ?? ref.current?.querySelector(`label[for="${campo.id}"]`)?.textContent)?.replace(' *', '') ?? 'Campo obrigatório'))
      if (focar) {
        const primeiro = invalidos[0]
        const controle = primeiro?.querySelector<HTMLElement>('input, select, textarea') ?? primeiro
        controle?.focus()
      }
    })
  }
  function enviar(evento: SubmitEvent<HTMLFormElement>) {
    onSubmit?.(evento)
    atualizar(true)
  }
  return <form {...props} ref={ref} onSubmit={enviar} onInput={(evento) => { onInput?.(evento); if (campos.length) atualizar(false) }}>
    {campos.length > 0 && <p className="resumo-erros" role="alert">⚠ {campos.length === 1 ? 'Revise o campo' : `Revise ${campos.length} campos`}: {campos.join(', ')}.</p>}
    {children}
  </form>
}
