import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

async function abrir(page: Page, form: string) {
  await page.route('**/api/**', (route) => {
    const caminho = new URL(route.request().url()).pathname
    if (caminho.endsWith('/settings')) return route.fulfill({ json: { diasLoteCritico: 90 } })
    if (caminho.endsWith('/categories')) return route.fulfill({ json: [{ id: 1, codigo: 'BAT', nome: 'Baterias', descricao: 'Teste', diasLimiteDescarte: 90, exigeChecklistPericulosidade: true }] })
    if (caminho.endsWith('/items/1')) return route.fulfill({ json: { id: 1, nome: 'Item sintético', categoriaId: 1, categoriaNome: 'Baterias', marca: 'Fabricante', condicao: 'usado', codigoBarras: 'teste', responsavel: 'Pessoa sintética', criadoPorId: '1', dataEntrada: '2026-10-01T10:00:00Z', atualizacao: '2026-10-01T10:00:00Z', classificacao: null, statusTriagem: 'aguardando', status: 'em-estoque', diasEmEstoque: 1 } })
    return route.fulfill({ json: [] })
  })
  await page.goto(`http://127.0.0.1:5183/e2e/form-harness.html?form=${form}`)
}

async function verificar(page: Page, id: string, titulo: string) {
  const campo = page.locator(`#${id}`)
  await expect(campo).toHaveAttribute('aria-invalid', 'true')
  const descricao = await campo.getAttribute('aria-describedby')
  expect(descricao).toBeTruthy()
  await expect(page.locator(`#${descricao?.split(' ')[0]}`)).toBeVisible()
  await expect(page.locator('.resumo-erros')).toContainText(titulo)
  await expect(campo).toBeFocused()
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(resultado.violations.map((v) => v.id)).toEqual([])
}

test('componente Funcionários: erros por campo, resumo, foco e correção', async ({ page }) => {
  await abrir(page, 'funcionarios')
  await page.getByRole('button', { name: 'Adicionar funcionário', exact: true }).click()
  await page.getByRole('button', { name: 'Concluir cadastro', exact: true }).click()
  await verificar(page, 'funcionario-nome', 'Nome')
  await page.locator('#funcionario-nome').fill('Pessoa sintética')
  await expect(page.locator('#funcionario-nome')).not.toHaveAttribute('aria-invalid', 'true')
})

test('componente Configurações: erros por campo, resumo e foco', async ({ page }) => {
  await abrir(page, 'configuracoes')
  await page.locator('#dias-lote-critico').fill('')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await verificar(page, 'dias-lote-critico', 'Dias para lote crítico')
})

test('componente Recicladora: erros por campo, resumo e foco', async ({ page }) => {
  await abrir(page, 'recicladora')
  await page.getByRole('button', { name: 'Adicionar recicladora', exact: true }).click()
  await page.getByRole('button', { name: 'Concluir cadastro', exact: true }).click()
  await verificar(page, 'recicladora-nome', 'Nome')
})

test('componente Login: erros por campo, resumo e foco', async ({ page }) => {
  await abrir(page, 'login')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await verificar(page, 'email', 'Email')
})

test('componente Triagem: erro associado ao grupo, resumo e foco', async ({ page }) => {
  await abrir(page, 'triagem')
  await page.getByRole('button', { name: 'Avançar', exact: true }).click()
  await expect(page.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('radio').first()).toBeFocused()
  await expect(page.locator('.resumo-erros')).toContainText('Classificação')
  await expect(page.getByRole('radiogroup')).toHaveAttribute('aria-describedby', 'triagem-classificacao-erro')
})
