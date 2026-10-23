import type { LogoProps } from '../../types/componentes/Logo'
export type { LogoProps } from '../../types/componentes/Logo'
import estilos from '../../../styles/components/Logo/Logo.module.css'

const wordmark = `${import.meta.env.BASE_URL}assets/logo-zera.png`
const wordmarkClaro = `${import.meta.env.BASE_URL}assets/logo-zera-claro.png`
const zMark = `${import.meta.env.BASE_URL}assets/z-mark.png`

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

