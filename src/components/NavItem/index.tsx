import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import estilos from './NavItem.module.css'

export interface NavItemProps {
  para: string
  rotulo: string
  Icone: LucideIcon
  exato?: boolean
}

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
