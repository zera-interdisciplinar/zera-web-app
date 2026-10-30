import { test, expect } from '@playwright/test'

const campos = [
  { id: 'modelo-vida-util', max: '600', inteiro: true },
  { id: 'modelo-garantia', max: '600', inteiro: true },
  { id: 'modelo-peso', max: '100000', inteiro: false },
  { id: 'capacidade', max: '2147483647', inteiro: true },
  { id: 'dias-lote-critico', max: '365', inteiro: true },
  { id: 'meta', max: '100', inteiro: true },
]
for (const campo of campos) test(`campo numérico ${campo.id} bloqueia sinais e limita colagem`, async ({ page }) => {
  await page.goto('http://127.0.0.1:5184/e2e/numeros-harness.html')
  const entrada = page.locator(`#${campo.id}`)
  await entrada.pressSequentially('-+eE12')
  await expect(entrada).toHaveValue('12')
  if (campo.inteiro) {
    await entrada.pressSequentially('.,')
    await expect(entrada).toHaveValue('12')
  }
  await entrada.evaluate((elemento) => {
    const dados = new DataTransfer()
    dados.setData('text/plain', '99999999999999')
    elemento.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dados }))
  })
  await expect(entrada).toHaveValue(campo.max)
  await entrada.focus()
  await entrada.hover()
  await page.mouse.wheel(0, -100)
  await expect(entrada).not.toBeFocused()
  await expect(entrada).toHaveValue(campo.max)
})

test('peso aceita decimal com vírgula na colagem e normaliza para ponto', async ({ page }) => {
  await page.goto('http://127.0.0.1:5184/e2e/numeros-harness.html')
  const peso = page.locator('#modelo-peso')
  await peso.evaluate((elemento) => {
    const dados = new DataTransfer()
    dados.setData('text/plain', '1,5')
    elemento.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dados }))
  })
  await expect(peso).toHaveValue('1.5')
  await peso.fill('')
  await peso.pressSequentially('1.5')
  await expect(peso).toHaveValue('1.5')
  await peso.fill('')
  await peso.pressSequentially('1,5')
  await expect(peso).toHaveValue('1.5')
})
