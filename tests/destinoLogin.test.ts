import { expect, it } from 'vitest'
import { destinoAposLogin } from '../src/utils/destinoLogin'

it('retorna ao detalhe depois de autenticar sem aceitar redirecionamento externo', () => {
  expect(destinoAposLogin({ de: '/itens/item-sintetico' })).toBe('/itens/item-sintetico')
  for (const de of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', 'javascript:alert(1)', null, 5]) expect(destinoAposLogin({ de })).toBe('/')
  expect(destinoAposLogin(undefined)).toBe('/')
})
