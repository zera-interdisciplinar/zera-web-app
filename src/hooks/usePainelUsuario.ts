import { useContext, useState } from 'react'
import { AuthContext } from '../context/auth'
import type { ControlePainelUsuario } from '../types/painelUsuario'

export function usePainelUsuario(): ControlePainelUsuario {
  const auth = useContext(AuthContext)
  const [indicadores, setIndicadores] = useState(false)
  return { funcionario: auth?.usuario?.perfil === 'funcionario', indicadores, alternar: () => setIndicadores(atual => !atual) }
}
