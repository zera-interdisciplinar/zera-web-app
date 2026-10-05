import wordmark from '../../assets/logo-zera.png'
import wordmarkClaro from '../../assets/logo-zera-claro.png'
import zMark from '../../assets/z-mark.png'
import estilos from './Logo.module.css'

export interface LogoProps {
  variante?: 'wordmark' | 'marca'
  tom?: 'padrao' | 'claro'
}

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
