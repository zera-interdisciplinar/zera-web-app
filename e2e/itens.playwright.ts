import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { base, fazerLogin, preparar } from './api-controlada'
import { controlarInventario } from './inventario-controlado'

/** Auth mocks first, then the inventory (later routes win), then the login. */
async function abrir(page: Page, path = '/itens') {
  await preparar(page, 'MANAGER', 0, base, false)
  const inventory = await controlarInventario(page)
  await fazerLogin(page)
  if (path !== '/') await page.getByRole('navigation', { name: 'Seções do sistema' }).getByRole('link', { name: 'Itens' }).click()
  await expect(page.getByRole('heading', { name: 'Gestão de itens', exact: true })).toBeVisible()
  return inventory
}

const dialog = (page: Page) => page.getByRole('dialog')
const rowOf = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name })

test('lista os itens ativos com as colunas do Figma e paginação do servidor (BR-15, T-15)', async ({ page }) => {
  const inventory = await abrir(page)
  const table = page.getByRole('table', { name: 'Todos os itens' })
  await expect(table.getByRole('columnheader')).toHaveText(['Item', 'Categoria', 'Status', 'Responsável', 'Atualização', 'Ação'])
  await expect(table.getByRole('row')).toHaveCount(21)
  await expect(rowOf(page, 'Impressora removida')).toHaveCount(0)
  await expect(page.getByText('47 resultados · página 1 de 3')).toBeVisible()
  expect(inventory.lists.at(-1)?.toString()).toBe('page=0&size=20')

  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(page).toHaveURL(/page=1/)
  await expect(page.getByText('página 2 de 3')).toBeVisible()
  expect(inventory.lists.at(-1)?.get('page')).toBe('1')
  await page.getByLabel('Por página').selectOption('50')
  await expect(page.getByText('página 1 de 1')).toBeVisible()
  // Never more than the server's maximum, and never one request per page to fill a client-side table.
  expect(Math.max(...inventory.lists.map((list) => Number(list.get('size'))))).toBeLessThanOrEqual(100)
})

test('busca e filtros múltiplos são aplicados em conjunto e persistem na URL', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('searchbox', { name: /Pesquisar/ }).fill('Tablet')
  await expect(rowOf(page, 'Tablet pendente')).toBeVisible()
  await expect(page).toHaveURL(/q=Tablet/)
  await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click()
  await page.getByRole('button', { name: /^Filtros/ }).click()
  const modal = dialog(page)
  await modal.getByRole('group', { name: 'Status', exact: true }).getByRole('button', { name: 'Em estoque', exact: true }).click()
  await modal.getByRole('group', { name: 'Status', exact: true }).getByRole('button', { name: 'Em aprovação', exact: true }).click()
  await modal.getByRole('group', { name: 'Categoria', exact: true }).getByRole('button', { name: 'Eletrônicos', exact: true }).click()
  await modal.getByRole('button', { name: 'Aplicar filtros', exact: true }).click()
  await expect(page).toHaveURL(/status=IN_STOCK&status=PENDING_APPROVAL&categoryId=cat-eletronicos/)
  await expect(rowOf(page, 'Tablet pendente')).toBeVisible()
  await expect(rowOf(page, 'Impressora removida')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Remover filtro Em estoque' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Remover filtro Em aprovação' })).toBeVisible()
  expect(inventory.lists.some((query) => query.get('status') === 'PENDING_APPROVAL')).toBe(true)
  await page.getByRole('button', { name: 'Remover filtro Em estoque' }).click()
  await expect(page).not.toHaveURL(/IN_STOCK/)
})

test('gestor não pode cadastrar itens e acessa estoque na página de itens', async ({ page }) => {
  const inventory = await abrir(page)
  await expect(page.getByRole('button', { name: 'Adicionar item' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Configurações' })).toHaveCount(0)
  await page.locator('summary', { hasText: 'Gestão do estoque' }).click()
  await expect(page.getByRole('heading', { name: 'Capacidade do estoque', exact: true })).toBeVisible()
  expect(inventory.writes).toEqual([])
})

test('T-12: editar envia só o que mudou e o "Limpar" apaga com string vazia (BR-12)', async ({ page }) => {
  const inventory = await abrir(page)
  inventory.items.find((item) => item.id === 'item-1')!.serialNumber = 'SN-1'
  await page.reload()
  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  const form = dialog(page)
  await expect(form.getByLabel('Nome do item')).toHaveValue('Item 01')
  await form.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(dialog(page)).toBeHidden()
  expect(inventory.writes).toEqual([])

  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  await form.getByLabel('Nome do item').fill('Item 01 revisado')
  await form.getByRole('button', { name: 'Limpar' }).first().click()
  await expect(form.getByLabel('Número de série')).toHaveValue('')
  await form.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item atualizado.' })).toBeVisible()
  expect(inventory.writes).toEqual([{ method: 'PATCH', path: '/api/v1/items/item-1', body: { name: 'Item 01 revisado', serialNumber: '' } }])
  await expect(rowOf(page, 'Item 01 revisado')).toBeVisible()
})

test('editar com alterações pendentes pede confirmação ao fechar, dentro da página', async ({ page }) => {
  await abrir(page)
  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  await dialog(page).getByLabel('Nome do item').fill('Outro nome')
  await page.keyboard.press('Escape')
  const pergunta = page.getByRole('dialog', { name: 'Descartar alterações?' })
  await expect(pergunta).toBeVisible()
  // Na pergunta, o foco abre na opção segura (manter o que foi digitado).
  await expect(pergunta.getByRole('button', { name: 'Continuar editando' })).toBeFocused()
  await pergunta.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(pergunta).toBeHidden()
  await expect(page.getByRole('dialog', { name: /Editar item/ })).toBeVisible()
  await expect(page.getByLabel('Nome do item')).toHaveValue('Outro nome')
  await page.keyboard.press('Escape')
  await pergunta.getByRole('button', { name: 'Descartar', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Editar Item 01' })).toBeFocused()
})

test('T-13: remover pede confirmação, é lógico e pode ser restaurado (BR-13)', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('button', { name: 'Remover Item 01' }).click()
  await expect(dialog(page)).toContainText('pode ser restaurado')
  await expect(dialog(page).getByRole('button', { name: 'Cancelar' })).toBeFocused()
  await dialog(page).getByRole('button', { name: 'Cancelar' }).click()
  expect(inventory.writes).toEqual([])
  await page.getByRole('button', { name: 'Remover Item 01' }).click()
  await dialog(page).getByRole('button', { name: 'Remover', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item removido.' })).toBeVisible()
  expect(inventory.writes).toEqual([{ method: 'DELETE', path: '/api/v1/items/item-1', body: undefined }])
  await expect(rowOf(page, 'Item 01')).toHaveCount(0)

  await page.getByRole('button', { name: /^Filtros/ }).click()
  await dialog(page).getByRole('button', { name: 'Removido', exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(rowOf(page, 'Item 01')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remover Item 01' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Restaurar Item 01' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item restaurado.' })).toBeVisible()
  expect(inventory.writes.at(-1)).toMatchObject({ method: 'POST', path: '/api/v1/items/item-1/restore' })
})

test('T-14: aprovar e reprovar (motivo obrigatório) só existem para item em aprovação (BR-14)', async ({ page }) => {
  const inventory = await abrir(page)
  await expect(rowOf(page, 'Item 01').getByRole('button', { name: /Aprovar/ })).toHaveCount(0)
  await rowOf(page, 'Tablet pendente').getByRole('button', { name: 'Reprovar Tablet pendente' }).click()
  await dialog(page).getByRole('button', { name: 'Reprovar', exact: true }).click()
  await expect(dialog(page).getByText('Informe o motivo da reprovação.')).toBeVisible()
  expect(inventory.writes).toEqual([])
  await dialog(page).getByLabel('Motivo').fill('Foto ilegível')
  await expect(dialog(page).getByText('13/500 caracteres')).toBeVisible()
  await dialog(page).getByRole('button', { name: 'Reprovar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item reprovado.' })).toBeVisible()
  expect(inventory.writes).toEqual([{ method: 'POST', path: '/api/v1/items/item-pending/reject', body: { reason: 'Foto ilegível' } }])
  expect(inventory.items.find((item) => item.id === 'item-pending')?.status).toBe('REJECTED')
})

test('T-14: aprovar leva o item ao estoque; 409 recarrega e avisa que o item mudou', async ({ page }) => {
  const inventory = await abrir(page)
  inventory.fail['POST /approve'] = 409
  await page.getByRole('button', { name: 'Aprovar Tablet pendente' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'O item mudou desde a última leitura' })).toBeVisible()
  await expect(rowOf(page, 'Tablet pendente').getByRole('button', { name: /Aprovar/ })).toBeVisible()
  await page.getByRole('button', { name: 'Aprovar Tablet pendente' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item aprovado e incluído no estoque.' })).toBeVisible()
  await expect(rowOf(page, 'Tablet pendente')).toContainText('Em estoque')
})

test('rascunho mostra "Concluir cadastro" e leva o item ao estoque (BR-10)', async ({ page }) => {
  const inventory = await abrir(page)
  await expect(rowOf(page, 'Monitor rascunho')).toContainText('Rascunho')
  await page.getByRole('button', { name: 'Concluir cadastro Monitor rascunho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Falta' }).or(page.getByRole('status').filter({ hasText: 'Faltam' }))).toBeVisible()
  expect(inventory.writes[0]).toMatchObject({ method: 'POST', path: '/api/v1/items/item-draft/submit' })
})

test('detalhe: dados, "—" para o que falta, histórico paginado e as mesmas ações', async ({ page }) => {
  await abrir(page)
  await rowOf(page, 'Tablet pendente').getByRole('link', { name: 'Tablet pendente' }).click()
  await expect(page).toHaveURL(/\/itens\/item-pending$/)
  await expect(page.getByRole('heading', { name: 'Tablet pendente', level: 1 })).toBeVisible()
  await expect(page.getByText('Em aprovação').first()).toBeVisible()
  await expect(page.getByText('Cadeira Ergo — Flexform')).toBeVisible()
  await expect(page.getByText('Sem previsão')).toBeVisible()
  await expect(page.getByText('Sem foto enviada pelo app')).toBeVisible()
  const history = page.getByRole('region', { name: 'Histórico' })
  await expect(history).toContainText('Item cadastrado')
  await expect(history).toContainText('Rascunho → Em aprovação')
  await page.getByRole('button', { name: 'Aprovar Tablet pendente' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item aprovado' })).toBeVisible()
  await expect(page.getByText('Em estoque').first()).toBeVisible()
  await page.getByRole('link', { name: 'Voltar para itens' }).click()
  await expect(page.getByRole('heading', { name: 'Gestão de itens', exact: true })).toBeVisible()
})

test('detalhe de item inexistente explica o que houve', async ({ page }) => {
  await abrir(page)
  await page.evaluate(() => { history.pushState(null, '', '/itens/nao-existe'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByRole('alert').filter({ hasText: 'Não encontramos este item.' })).toBeVisible()
})

test('T-04: nenhuma tela chama pontos de reciclagem ou descarte (BR-03, BR-04)', async ({ page }) => {
  const forbidden: string[] = []
  page.on('request', (request) => { if (/recycling-places|\/disposals|latitude|longitude/i.test(request.url())) forbidden.push(request.url()) })
  await abrir(page)
  await rowOf(page, 'Item 02').getByRole('link', { name: 'Item 02' }).click()
  await expect(page.getByRole('heading', { name: 'Item 02', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar para itens' }).click()
  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  await expect(dialog(page).getByText(/latitude|longitude|descarte/i)).toHaveCount(0)
  expect(forbidden).toEqual([])
})

test('acessibilidade: lista, formulário aberto e detalhe sem violações graves (axe)', async ({ page }) => {
  await abrir(page)
  const serious = async () => (await new AxeBuilder({ page }).analyze()).violations.filter((item) => item.impact === 'critical' || item.impact === 'serious').map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
  expect(await serious()).toEqual([])
  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  await dialog(page).getByLabel('Nome do item').fill('')
  await dialog(page).getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(dialog(page).getByText('Informe o nome do item.')).toBeVisible()
  expect(await serious()).toEqual([])
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: 'Descartar alterações?' }).getByRole('button', { name: 'Descartar', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await rowOf(page, 'Item 03').getByRole('link', { name: 'Item 03' }).click()
  await expect(page.getByRole('heading', { name: 'Item 03', level: 1 })).toBeVisible()
  expect(await serious()).toEqual([])
})
