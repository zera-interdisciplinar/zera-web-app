import type { DashboardSnapshot } from '../../src/features/dashboard/schemas/snapshot'

/** Synthetic snapshot in the shape of the ms-analytics-bff contract (Confluence page 7). */
export const dashboardSnapshotMock: DashboardSnapshot = {
  batch_id: 'synthetic-batch-01',
  extracted_at: '2026-10-12T15:30:00-03:00',
  organization: { id: 'org-1', name: 'Organização de teste' },
  applied_filters: { period: '6m', date_from: '2026-05-01', date_to: '2026-10-12', category: null, status: null, unit_id: null, responsible: null, query: null, view: 'todos' },
  available_filters: {
    categories: ['Tecnologia', 'Mobiliário', 'Acessórios'],
    statuses: ['PENDING_APPROVAL', 'DISCARDED', 'ACTIVE', 'IN_MAINTENANCE', 'REUSED', 'REMOVED'],
    units: [{ id: 'unit-leste', name: 'Polo Leste' }, { id: 'unit-sul', name: 'Polo Sul' }],
    responsibles: [{ id: 'user-1', name: 'Ana Souza' }],
    views: ['todos', 'pendentes', 'categoria'],
    periods: ['30d', '6m', '12m'],
  },
  kpis: {
    itens_cadastrados: { value: 1230, change_percent: 12.4 },
    taxa_reciclagem: { percent: 68, change_points: 4.5 },
    aguardando_aprovacao: { value: 42, prioritarios: 8 },
    impacto_recuperado: { kg: 3100, tonnes: 3.1 },
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
  ],
  alertas: { abertos: 6, por_gravidade: [{ gravidade: 'HIGH', quantidade: 2 }, { gravidade: 'MEDIUM', quantidade: 3 }, { gravidade: 'LOW', quantidade: 1 }] },
}

/** The snapshot as an SSE frame, ready to be fulfilled by Playwright or enqueued in a stream. */
export const snapshotFrame = (snapshot: DashboardSnapshot = dashboardSnapshotMock) => `event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`
