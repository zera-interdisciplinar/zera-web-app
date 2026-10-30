import { afterEach, expect, it, vi } from 'vitest'

vi.mock('../src/services/apiReal', () => ({ modoDemonstracao: false, requisitarApiReal: vi.fn() }))
import { requisitarApiReal } from '../src/services/apiReal'
import { listarUsuarios } from '../src/services/usuarioService'

const pessoa = { userId: 'usuario', name: 'Pessoa', email: 'pessoa@example.invalid', role: 'EMPLOYEE', status: 'ACTIVE', unitId: 'unidade', managerId: null, imageUrl: null }
afterEach(() => vi.resetAllMocks())
it('lê usuários válidos e lista vazia', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue([pessoa])
  await expect(listarUsuarios()).resolves.toMatchObject([{ id: 'usuario', perfil: 'funcionario' }])
  vi.mocked(requisitarApiReal).mockResolvedValue([])
  await expect(listarUsuarios()).resolves.toEqual([])
})
it.each([null, {}, [null], [{ ...pessoa, userId: undefined }], [{ ...pessoa, unitId: 1 }], [{ ...pessoa, role: 'OUTRO' }]])('rejeita resposta inválida %j', async resposta => {
  vi.mocked(requisitarApiReal).mockResolvedValue(resposta)
  await expect(listarUsuarios()).rejects.toThrow('Tente novamente')
})
