export type UnidadeEvolucaoDemo = {
  // TODO(contrato): /overview expõe unidade em available_filters, mas não define o endpoint analítico desta aba.
  id: string
  // TODO(contrato): nome de unidade para os dados temporais não está ligado a um endpoint confirmado.
  nome: string
}

export type ItemEvolucaoDemo = {
  // TODO(contrato): /overview não define registros individuais de cadastro.
  id: string
  // TODO(contrato): data de cadastro diária não é coberta por /overview.
  dataCadastro: string
  // TODO(contrato): não há vínculo de unidade por item no payload /overview.
  unidadeId: string
  // TODO(contrato): situação detalhada mensal não é coberta por /overview.
  situacao: string
  // TODO(contrato): idade média por mês requer a idade individual, não definida em /overview.
  idadeMeses: number
}

export type EventoEvolucaoDemo = {
  // TODO(contrato): /overview não define registros individuais de evento.
  id: string
  // TODO(contrato): data de evento por dia não é coberta por /overview.
  dataEvento: string
  // TODO(contrato): não há vínculo de unidade por evento no payload /overview.
  unidadeId: string
  // TODO(contrato): categorias de evento e movimentação não são definidas por /overview.
  tipo: string
  // TODO(contrato): o vínculo evento-item não é definido por /overview.
  itemId: string
}

const mesesDemo = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
const situacoesDemo = ['Em estoque', 'Em manutenção', 'Aguardando aprovação', 'Descartado']
const tiposEventoDemo = [
  'Aprovação',
  'Cadastro',
  'Criação em lote',
  'Descarte',
  'Edição',
  'Manutenção',
  'Movimentação',
  'Remanejamento',
  'Transferência',
]
const unidadesDemo: UnidadeEvolucaoDemo[] = [
  { id: 'unit-centro', nome: 'Unidade Centro' },
  { id: 'unit-norte', nome: 'Unidade Norte' },
]

// TODO(contrato): dados diários e dimensões de item abaixo são sintéticos e só podem aparecer em demo.
const itensDemo: ItemEvolucaoDemo[] = Array.from({ length: 32 }, (_, index) => {
  const mesIndex = Math.floor((index / 32) * mesesDemo.length)
  const dia = String(((index * 5) % 27) + 1).padStart(2, '0')

  return {
    id: `item-demo-${index + 1}`,
    dataCadastro: `${mesesDemo[mesIndex]}-${dia}`,
    unidadeId: unidadesDemo[index % unidadesDemo.length].id,
    situacao: situacoesDemo[index % situacoesDemo.length],
    idadeMeses: 2 + ((index * 9) % 60),
  }
})

// TODO(contrato): eventos diários e seus tipos não são fornecidos pela rota /overview.
const eventosDemo: EventoEvolucaoDemo[] = Array.from({ length: 77 }, (_, index) => {
  const mesIndex = Math.min(mesesDemo.length - 1, Math.floor((index / 77) * mesesDemo.length))
  const dia = String(((index * 7) % 27) + 1).padStart(2, '0')

  return {
    id: `evento-demo-${index + 1}`,
    dataEvento: `${mesesDemo[mesIndex]}-${dia}`,
    unidadeId: unidadesDemo[index % unidadesDemo.length].id,
    tipo: tiposEventoDemo[index % tiposEventoDemo.length],
    itemId: `item-demo-${(index % itensDemo.length) + 1}`,
  }
})

export const evolucaoMovimentacoesFixture = {
  // Os valores 30d, 6m e 12m são definidos em available_filters.periods; as séries abaixo continuam sendo mock.
  periodos: ['30d', '6m', '12m'] as const,
  // TODO(contrato): unidade existe em filtros do overview, mas a série por unidade não está no contrato.
  unidades: unidadesDemo,
  // TODO(contrato): cadastros diários, idade individual e situação mensal não são definidos em /overview.
  itens: itensDemo,
  // TODO(contrato): eventos diários, tipo, unidade e vínculo item-evento não são definidos em /overview.
  eventos: eventosDemo,
  // TODO(contrato): eventos que representam movimentações não têm enum confirmado no contrato.
  tiposMovimentacao: ['Movimentação', 'Remanejamento', 'Transferência'],
}
