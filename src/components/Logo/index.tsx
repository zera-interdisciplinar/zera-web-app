import type { LogoProps } from '../../types/componentes/Logo'
export type { LogoProps } from '../../types/componentes/Logo'
import wordmark from '../../../assets/logo-zera.png'
import wordmarkClaro from '../../../assets/logo-zera-claro.png'
import zMark from '../../../assets/z-mark.png'
import estilos from '../../../styles/components/Logo/Logo.module.css'

export function Logo({ variante = 'wordmark', tom = 'padrao' }: LogoProps) {
  if (variante === 'marca') {
    return <img className={estilos.marca} src={zMark} alt="" aria-hidden="true" />
  }
  return (
    <img
      className={estilos.wordmark}
      src={tom === 'claro' ? wordmarkClaro : wordmark}
      alt="Zera — gestão de resíduos eletrônicos"
    />
  )
}

