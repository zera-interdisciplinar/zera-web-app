import { Outlet } from 'react-router-dom'
import { NavegacaoPublica } from '../NavegacaoPublica'

export function EstruturaPublica() {
  return <><NavegacaoPublica /><Outlet /><footer className="rodape-sistema">ZERA · Gestão de resíduos eletrônicos</footer></>
}
