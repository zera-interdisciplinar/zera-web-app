import type { ToastProps } from '../../types/componentes/Toast'
export type { ToastProps } from '../../types/componentes/Toast'
import estilos from '../../../styles/components/Toast/Toast.module.css'

export function Toast({ mensagem }: ToastProps) {
  return (
    <div className={mensagem ? estilos.toast : 'somente-leitor-de-tela'} role="status" aria-atomic="true">
      {mensagem}
    </div>
  )
}
