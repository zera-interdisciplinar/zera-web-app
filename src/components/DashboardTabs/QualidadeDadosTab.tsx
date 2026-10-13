import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { qualidadeDadosDemo } from '../../mocks/dashboardTabs/qualidadeDados'
import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from './QualidadeDadosTab.module.css'

interface QualidadeDadosTabProps {
  demo: boolean
  filtros: FiltrosDashboard
}
const cores = { preenchido: '#ffa500', ausente: '#087f9c', alerta: '#087f9c', escala5: '#ffa500' }
const SITUACAO_POR_STATUS: Record<string, string> = {
  PENDING_APPROVAL: 'Aguardando aprovação',
  DISCARDED: 'Descartado',
  ACTIVE: 'Em estoque',
  IN_MAINTENANCE: 'Em manutenção',
  REUSED: 'Reuso',
  REMOVED: 'Removido',
}

export function QualidadeDadosTab({ demo, filtros }: QualidadeDadosTabProps) {
  const registros = useMemo(() => {
    if (!demo) return []

    return qualidadeDadosDemo.registros.filter((registro) =>
      (!filtros.status || registro.situacao === SITUACAO_POR_STATUS[filtros.status]) &&
      (!filtros.category || registro.categoria === filtros.category) &&
      (!filtros.unitId || registro.unidadeId === filtros.unitId),
    )
  }, [demo, filtros.category, filtros.status, filtros.unitId])

  const alertas = useMemo(() => {
    const contagem = new Map<string, number>()
    registros.forEach((registro) => {
      if (registro.alertaTipo) contagem.set(registro.alertaTipo, (contagem.get(registro.alertaTipo) ?? 0) + 1)
    })
    return [...contagem].map(([tipo, quantidade]) => ({ tipo, quantidade }))
  }, [registros])

  const preenchimento = useMemo(
    () => {
      if (!demo) return []

      return qualidadeDadosDemo.campos.map(({ chave, campo }) => {
        const preenchido = registros.filter((registro) => registro.preenchimento[chave]).length
        return { campo, preenchido, ausente: registros.length - preenchido }
      })
    },
    [demo, registros],
  )

  const intensidade = useMemo(() => {
    const quantidades = new Map<number, number>()
    registros.forEach((registro) => {
      quantidades.set(registro.intensidadeUso, (quantidades.get(registro.intensidadeUso) ?? 0) + 1)
    })
    return [...quantidades].map(([escala, quantidade]) => ({ escala: String(escala), quantidade }))
  }, [registros])

  return (
    <section className={estilos.pagina} aria-label="Qualidade dos dados e alertas">
      {demo ? (
        <div className={estilos.grade}>
          <article className={`${estilos.cartao} ${estilos.destaque}`}>
            <h2>Alertas por tipo<SeloDemonstracao /></h2>
            <div className={estilos.grafico} role="img" aria-label="Alertas registrados por tipo">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertas} layout="vertical" margin={{ top: 12, right: 24, bottom: 4, left: 16 }}>
                  <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} label={{ value: 'Alertas registrados', position: 'insideBottom', offset: -2 }} />
                  <YAxis type="category" dataKey="tipo" width={150} />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Alertas registrados" fill={cores.alerta} radius={[0, 3, 3, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={estilos.cartao}>
            <h2>Preenchimento dos dados dos itens<SeloDemonstracao /></h2>
            <div className={estilos.grafico} role="img" aria-label="Dados preenchidos e ausentes por campo">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={preenchimento} margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="campo" interval={0} height={68} angle={-12} textAnchor="end" />
                  <YAxis allowDecimals={false} label={{ value: 'Quantidade de registros', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="ausente" name="Ausente" stackId="total" fill={cores.ausente} isAnimationActive={false} />
                  <Bar dataKey="preenchido" name="Preenchido" stackId="total" fill={cores.preenchido} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={estilos.cartao}>
            <h2>Taxa de alertas resolvidos<SeloDemonstracao /></h2>
            <p className={estilos.notaResolucao}>
              Ainda não calculável: falta confirmar quais situações indicam que um alerta foi resolvido.
            </p>
          </article>

          <article className={estilos.cartao}>
            <h2>Intensidade de uso — validar escala com a equipe<SeloDemonstracao /></h2>
            <div className={estilos.legendaEscala} aria-label="Escala de intensidade de uso">
              <span><i className={estilos.amostraEscala3} aria-hidden="true" /> 3</span>
              <span><i className={estilos.amostraEscala5} aria-hidden="true" /> 5</span>
            </div>
            <div className={estilos.grafico} role="img" aria-label="Quantidade de itens por intensidade de uso">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intensidade} margin={{ top: 12, right: 28, bottom: 18, left: 4 }}>
                  <CartesianGrid stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="escala" label={{ value: 'Intensidade de uso', position: 'insideBottom', offset: -8 }} />
                  <YAxis allowDecimals={false} label={{ value: 'Quantidade de itens', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Itens" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                    {intensidade.map((ponto) => (
                      <Cell key={ponto.escala} fill={ponto.escala === '5' ? cores.escala5 : cores.alerta} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      ) : (
        <div className={estilos.semFonte} role="status">
          Sem fonte confirmada para os campos de qualidade e alertas desta aba. Os gráficos aparecem com dados demonstrativos quando o modo de demonstração está ativo.
        </div>
      )}
    </section>
  )
}
