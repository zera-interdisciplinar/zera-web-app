import { z } from 'zod'
import { isoDate, isoDateTime } from './commonSchemas'

export const PERIODS = ['30d', '6m', '12m'] as const
export const VIEWS = ['todos', 'pendentes', 'categoria'] as const

const count = z.number().int().nonnegative()
/** `null` means "no way to compute", never zero (BR-08), so it is kept as null all the way to the screen. */
const nullableNumber = z.number().nullable()
const named = z.object({ id: z.string(), name: z.string() })
const share = z.object({ nome: z.string(), quantidade: count, percentual: nullableNumber })

/** Snapshot event of `GET /api/v1/dashboard/overview` (ms-analytics-bff, Confluence page 7). */
export const snapshotSchema = z.object({
  batch_id: z.string().min(1),
  extracted_at: isoDateTime,
  organization: named,
  applied_filters: z.object({
    period: z.enum(PERIODS),
    date_from: isoDate.nullable(),
    date_to: isoDate.nullable(),
    category: z.string().nullable(),
    status: z.string().nullable(),
    unit_id: z.string().nullable(),
    responsible: z.string().nullable(),
    query: z.string().nullable(),
    view: z.enum(VIEWS),
  }),
  available_filters: z.object({
    categories: z.array(z.string()),
    statuses: z.array(z.string()),
    units: z.array(named),
    responsibles: z.array(named),
    views: z.array(z.string()),
    periods: z.array(z.string()),
  }),
  kpis: z.object({
    itens_cadastrados: z.object({ value: count, change_percent: nullableNumber }),
    taxa_reciclagem: z.object({ percent: nullableNumber, change_points: nullableNumber }),
    aguardando_aprovacao: z.object({ value: count, prioritarios: count }),
    impacto_recuperado: z.object({ kg: z.number().nonnegative(), tonnes: z.number().nonnegative() }),
  }),
  itens_por_mes: z.array(z.object({ mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), cadastrados: count, encaminhados: count })),
  circularidade: z.object({ percent: nullableNumber }),
  por_categoria: z.array(share),
  por_status: z.array(share),
  alertas: z.object({ abertos: count, por_gravidade: z.array(z.object({ gravidade: z.string(), quantidade: count })) }),
})

export const unavailableSchema = z.object({ detail: z.string() })
