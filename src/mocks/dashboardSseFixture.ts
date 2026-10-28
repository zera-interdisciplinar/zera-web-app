import type { DashboardMockVisaoGeral, DashboardSnapshot } from '../types/dashboardAnalytics'

// Valores sintéticos, criados para demonstração e sem relação com registros reais ou com as imagens.
export const dashboardSnapshotMock: DashboardSnapshot = {
  batch_id: 'mock-dashboard-synthetic-01',
  extracted_at: '2026-10-12T15:30:00-03:00',
  organization: { id: 'org-demo', name: 'Ambiente demonstrativo' },
  applied_filters: {
    period: '6m',
    date_from: '2026-05-01',
    date_to: '2026-10-12',
    category: null,
    status: null,
    unit_id: null,
    responsible: null,
    query: null,
    view: 'todos',
  },
  available_filters: {
    categories: ['Tecnologia', 'Mobiliário', 'Acessórios'],
    statuses: ['PENDING_APPROVAL', 'DISCARDED', 'ACTIVE', 'IN_MAINTENANCE', 'REUSED', 'REMOVED'],
    units: [{ id: 'unit-leste', name: 'Polo Leste' }, { id: 'unit-sul', name: 'Polo Sul' }],
    responsibles: [{ id: 'user-demo', name: 'Pessoa demonstrativa' }],
    views: ['todos', 'pendentes', 'categoria'],
    periods: ['30d', '6m', '12m'],
  },
  kpis: {
    itens_cadastrados: { value: 47, change_percent: 12.4 },
    taxa_reciclagem: { percent: 58.6, change_points: -2.1 },
    aguardando_aprovacao: { value: 5, prioritarios: 2 },
    impacto_recuperado: { kg: 186.4, tonnes: 0.186 },
  },
  itens_por_mes: [
    { mes: '2026-05', cadastrados: 4, encaminhados: 1 },
    { mes: '2026-06', cadastrados: 6, encaminhados: 3 },
    { mes: '2026-07', cadastrados: 7, encaminhados: 2 },
    { mes: '2026-08', cadastrados: 8, encaminhados: 4 },
    { mes: '2026-09', cadastrados: 9, encaminhados: 5 },
    { mes: '2026-10', cadastrados: 13, encaminhados: 7 },
  ],
  circularidade: { percent: 62.4 },
  por_categoria: [
    { nome: 'Tecnologia', quantidade: 21, percentual: 44.68 },
    { nome: 'Mobiliário', quantidade: 17, percentual: 36.17 },
    { nome: 'Acessórios', quantidade: 9, percentual: 19.15 },
  ],
  por_status: [
    { nome: 'PENDING_APPROVAL', quantidade: 5, percentual: 10.64 },
    { nome: 'DISCARDED', quantidade: 10, percentual: 21.28 },
    { nome: 'ACTIVE', quantidade: 13, percentual: 27.66 },
    { nome: 'IN_MAINTENANCE', quantidade: 7, percentual: 14.89 },
    { nome: 'REUSED', quantidade: 8, percentual: 17.02 },
    { nome: 'REMOVED', quantidade: 4, percentual: 8.51 },
  ],
  alertas: { abertos: 6, por_gravidade: [{ gravidade: 'HIGH', quantidade: 2 }, { gravidade: 'MEDIUM', quantidade: 3 }, { gravidade: 'LOW', quantidade: 1 }] },
}

// TODO(contrato): eventos e modelos não existem no snapshot do ms-analytics-bff.
// TODO(contrato): danos e eventos/itens não têm rota documentada neste checkout.
// TODO(contrato): fabricantes, modelos, condição e classificação de reciclabilidade não existem no contrato.
export const dashboardOverviewMock: DashboardMockVisaoGeral = {
  eventosRegistrados: 96,
  modelosCadastrados: 8,
  danosInformados: 4,
  eventosPorItem: 2.04,
  materiaisClassificados: 74,
  itensPorCondicao: [{ name: 'Novo', value: 25 }, { name: 'Usado', value: 22 }],
  itensPorFabricante: [{ name: 'Nimbu', value: 9 }, { name: 'Orbit Labs', value: 14 }, { name: 'Vega', value: 11 }, { name: 'Acme', value: 13 }],
  itensPorModelo: [
    { name: 'Mesa A4', value: 6 },
    { name: 'Lumi 14', value: 8 },
    { name: 'Nexo Mini', value: 9 },
    { name: 'Prisma 2', value: 7 },
    { name: 'Vega Dock', value: 10 },
    { name: 'Zetta Hub', value: 7 },
  ],
}

export function respostaSse(event: string, data: unknown): Response {
  const fluxo = new ReadableStream<Uint8Array>({
    start(controlador) {
      const texto = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      controlador.enqueue(new TextEncoder().encode(texto))
    },
  })
  return new Response(fluxo, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  })
}
