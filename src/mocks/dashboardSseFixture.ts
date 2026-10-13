import type { DashboardMockVisaoGeral, DashboardSnapshot } from '../types/dashboardAnalytics'

// Fixture espelha a referência visual e o payload publicado no contrato.
export const dashboardSnapshotMock: DashboardSnapshot = {
  batch_id: 'mock-dashboard-2026-10',
  extracted_at: '2026-10-12T15:30:00-03:00',
  organization: { id: 'org-demo', name: 'Zera — demonstração' },
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
    categories: ['Notebook'],
    statuses: ['PENDING_APPROVAL', 'DISCARDED', 'ACTIVE', 'IN_MAINTENANCE', 'REUSED', 'REMOVED'],
    units: [{ id: 'unit-centro', name: 'Unidade Centro' }],
    responsibles: [{ id: 'user-ana', name: 'Ana' }],
    views: ['todos', 'pendentes', 'categoria'],
    periods: ['30d', '6m', '12m'],
  },
  kpis: {
    itens_cadastrados: { value: 32, change_percent: 66.67 },
    taxa_reciclagem: { percent: 93.75, change_points: 1.3 },
    aguardando_aprovacao: { value: 4, prioritarios: 1 },
    impacto_recuperado: { kg: 310.5, tonnes: 0.311 },
  },
  itens_por_mes: [
    { mes: '2026-05', cadastrados: 2, encaminhados: 1 },
    { mes: '2026-06', cadastrados: 4, encaminhados: 2 },
    { mes: '2026-07', cadastrados: 5, encaminhados: 3 },
    { mes: '2026-08', cadastrados: 6, encaminhados: 4 },
    { mes: '2026-09', cadastrados: 7, encaminhados: 4 },
    { mes: '2026-10', cadastrados: 8, encaminhados: 5 },
  ],
  circularidade: { percent: 93.75 },
  por_categoria: [{ nome: 'Notebook', quantidade: 32, percentual: 100 }],
  por_status: [
    { nome: 'PENDING_APPROVAL', quantidade: 4, percentual: 12.5 },
    { nome: 'DISCARDED', quantidade: 8, percentual: 25 },
    { nome: 'ACTIVE', quantidade: 8, percentual: 25 },
    { nome: 'IN_MAINTENANCE', quantidade: 3, percentual: 9.38 },
    { nome: 'REUSED', quantidade: 7, percentual: 21.87 },
    { nome: 'REMOVED', quantidade: 2, percentual: 6.25 },
  ],
  alertas: { abertos: 3, por_gravidade: [{ gravidade: 'HIGH', quantidade: 1 }, { gravidade: 'MEDIUM', quantidade: 2 }] },
}

// TODO(contrato): eventos e modelos não existem no snapshot do ms-analytics-bff.
// TODO(contrato): danos e eventos/itens não têm rota documentada neste checkout.
// TODO(contrato): fabricantes, modelos, condição e classificação de reciclabilidade não existem no contrato.
export const dashboardOverviewMock: DashboardMockVisaoGeral = {
  eventosRegistrados: 77,
  modelosCadastrados: 6,
  danosInformados: 0,
  eventosPorItem: 2.41,
  materiaisClassificados: 100,
  itensPorCondicao: [{ name: 'Novo', value: 20 }, { name: 'Usado', value: 12 }],
  itensPorFabricante: [{ name: 'Apple', value: 2 }, { name: 'Dell', value: 10 }, { name: 'Lenovo', value: 16 }, { name: 'Toshiba', value: 4 }],
  itensPorModelo: [
    { name: 'Latitude 5420', value: 4 },
    { name: 'MacBook Air M2', value: 2 },
    { name: 'Razr', value: 2 },
    { name: 'Tátil', value: 2 },
    { name: 'ThinkPad T14', value: 16 },
    { name: 'UltraSlim 7', value: 6 },
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
