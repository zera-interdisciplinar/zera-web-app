export type ItemVidaUtilDemo = {
  // TODO(contrato): a rota /overview não define um identificador de item para os gráficos desta aba.
  id: string
  // TODO(contrato): /overview expõe a categoria como filtro, mas não fornece linhas de item para cruzamento de vida útil.
  categoria: string
  // TODO(contrato): /overview expõe status como filtro, mas não fornece registros individuais para estes cruzamentos.
  situacao: string
  // TODO(contrato): a rota /overview não define a condição do item.
  condicao: string
  // TODO(contrato): a rota /overview não define o mês de cadastro individual.
  mesCadastro: string
  // TODO(contrato): a rota /overview não define a idade do item em meses.
  idadeMeses: number
  // TODO(contrato): a rota /overview não define o peso estimado em quilogramas.
  pesoKg: number
  // TODO(contrato): a rota /overview não define a vida útil estimada em meses.
  vidaUtilMeses: number
  // TODO(contrato): a rota /overview não define a garantia em meses.
  garantiaMeses: number
  // TODO(contrato): a rota /overview não define o percentual de vida útil consumida.
  vidaUtilConsumidaPercentual: number
  // TODO(contrato): a rota /overview não define os meses restantes de vida útil.
  mesesRestantes: number
}

const categoriasDemo = ['Tecnologia', 'Mobiliário', 'Acessórios']
const situacoesDemo = [
  'Aguardando aprovação',
  'Descartado',
  'Em estoque',
  'Em manutenção',
  'Remanufaturado',
  'Reservado',
]
const condicoesDemo = ['Novo', 'Usado']
const mesesDemo = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']

// TODO(contrato): todos os valores abaixo são sintéticos e só podem aparecer em modo de demonstração.
const itensDemo: ItemVidaUtilDemo[] = Array.from({ length: 41 }, (_, index) => {
  const idadeMeses = 4 + ((index * 17) % 86)
  const vidaUtilMeses = 24 + ((index * 19) % 84)
  const vidaUtilConsumidaPercentual = Math.min(98, Math.round((idadeMeses / vidaUtilMeses) * 100))

  return {
    id: `demo-${String(index + 1).padStart(3, '0')}`,
    categoria: categoriasDemo[index % categoriasDemo.length],
    situacao: situacoesDemo[index % situacoesDemo.length],
    condicao: condicoesDemo[index % condicoesDemo.length],
    mesCadastro: mesesDemo[Math.floor(index / 7)],
    idadeMeses,
    pesoKg: Number((0.7 + ((index * 23) % 67) * 0.65).toFixed(1)),
    vidaUtilMeses,
    garantiaMeses: [6, 18, 30, 42][index % 4],
    vidaUtilConsumidaPercentual,
    mesesRestantes: Math.max(0, vidaUtilMeses - idadeMeses),
  }
})

export const itensVidaUtilFixture = {
  // TODO(contrato): opções nesta fixture são exemplos; em produção, usar available_filters.categories.
  categorias: categoriasDemo,
  // TODO(contrato): opções nesta fixture são exemplos; em produção, usar available_filters.statuses.
  situacoes: situacoesDemo,
  // TODO(contrato): opções de condição não foram definidas para esta aba.
  condicoes: condicoesDemo,
  // TODO(contrato): mês de cadastro individual não está disponível no contrato SSE.
  mesesCadastro: mesesDemo,
  // TODO(contrato): itens e medidas desta aba não são fornecidos pelo contrato SSE.
  itens: itensDemo,
}
