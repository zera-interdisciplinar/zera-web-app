import type { NavItemProps } from '../../types/componentes/NavItem'
export type { NavItemProps } from '../../types/componentes/NavItem'
import { NavLink } from 'react-router-dom'

import estilos from '../../../styles/components/NavItem/NavItem.module.css'

export function NavItem({ para, rotulo, Icone, exato = false }: NavItemProps) {
  return (
    <li className={estilos.item}>

      <NavLink
        to={para}
        end={exato}
        className={({ isActive }) => `${estilos.link} ${isActive ? estilos.ativo : ''}`}
      >
        <Icone size={20} aria-hidden="true" />
        <span>{rotulo}</span>
      </NavLink>
    </li>
  )
}
