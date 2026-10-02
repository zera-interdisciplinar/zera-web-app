import estilos from './Toast.module.css'

export interface ToastProps {
  mensagem: string | null
}

export function Toast({ mensagem }: ToastProps) {
  if (!mensagem) return null

  return (
    <div className={estilos.toast} role="status">
      {mensagem}
    </div>
  )
}
