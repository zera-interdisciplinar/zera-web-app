import type { UserOutput } from '../types/apiReal'
import { ehObjeto, ehTexto } from './guardasApi'

export function ehUsuarioApi(valor: unknown): valor is UserOutput {
  return ehObjeto(valor)
    && ehTexto(valor.userId) && valor.userId.trim().length > 0
    && ehTexto(valor.name) && valor.name.trim().length > 0
    && ehTexto(valor.email) && valor.email.trim().length > 0
    && (valor.role === 'MANAGER' || valor.role === 'EMPLOYEE')
    && ehTexto(valor.status) && valor.status.trim().length > 0
    && ehTexto(valor.unitId) && valor.unitId.trim().length > 0
}
