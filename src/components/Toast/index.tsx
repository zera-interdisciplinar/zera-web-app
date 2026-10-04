import estilos from './Toast.module.css'

export interface ToastProps {
  mensagem: string | null
}

export function Toast({ mensagem }: ToastProps) {
  return (
    <div className={mensagem ? estilos.toast : 'somente-leitor-de-tela'} role="status" aria-atomic="true">
      {mensagem}
    </div>
  )
}
