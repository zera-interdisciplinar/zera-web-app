import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { EvolucaoMovimentacoesTab } from '../src/components/DashboardTabs/EvolucaoMovimentacoesTab'
import { QualidadeDadosTab } from '../src/components/DashboardTabs/QualidadeDadosTab'
import { dashboardSnapshotMock } from './fixtures/dashboardSseFixture'
import { VisaoGeralTab } from '../src/components/DashboardTabs/VisaoGeralTab'
import { GraficoDados } from '../src/components/GraficoDados'

it('exibe as séries mensais e alertas recebidos sem inventar eventos', () => {
  const snapshot = structuredClone(dashboardSnapshotMock)
  snapshot.itens_por_mes = [{ mes: '2026-10', cadastrados: 17, encaminhados: 3 }]
  snapshot.alertas = { abertos: 4, por_gravidade: [{ gravidade: 'HIGH', quantidade: 4 }] }
  const evolucao = renderToStaticMarkup(createElement(EvolucaoMovimentacoesTab, { snapshot }))
  const qualidade = renderToStaticMarkup(createElement(QualidadeDadosTab, { snapshot }))
  expect(evolucao).toContain('2026-10')
  expect(evolucao).not.toContain('>17<')
  expect(evolucao).toContain('>3<')
  expect(evolucao).toContain('Encaminhamentos por mês')
  expect(qualidade).toContain('>4<')
  expect(qualidade).toContain('Alta')
})

it('distingue zero publicado de preparação, sem barras com altura inventada', () => {
  const vazio = renderToStaticMarkup(createElement(GraficoDados, { titulo: 'Série real vazia', eixo: 'Mês', unidade: 'itens', pontos: [{ rotulo: '2026-10', valor: 0 }], vazio: 'Nenhum cadastro contabilizado neste período.' }))
  expect(vazio).toContain('Nenhum cadastro contabilizado neste período.')
  expect(vazio).not.toContain('<svg')
  expect(renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot: null }))).toContain('Preparando os dados')
  expect(renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot: null, aguardando: false }))).toBe('')
})

it('apresenta estado vazio quando os indicadores e distribuições estão vazios', () => {
  const snapshot = structuredClone(dashboardSnapshotMock)
  snapshot.kpis.itens_cadastrados.value = 0
  snapshot.por_categoria = []
  snapshot.por_status = []
  snapshot.kpis.itens_cadastrados.change_percent = null
  snapshot.kpis.aguardando_aprovacao = { value: 0, prioritarios: 0 }
  snapshot.kpis.impacto_recuperado = { kg: 0, tonnes: 0 }
  snapshot.kpis.taxa_reciclagem = { percent: null, change_points: null }
  snapshot.circularidade.percent = null
  snapshot.alertas = { abertos: 0, por_gravidade: [] }
  snapshot.itens_por_mes = [{ mes: '2026-10', cadastrados: 0, encaminhados: 0 }]
  const html = renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot }))
  expect(html).toContain('Ainda não há dados para exibir.')
  snapshot.itens_por_mes[0].encaminhados = 1
  expect(renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot }))).not.toContain('Ainda não há dados para exibir.')
})

it('destaca valor real de série longa sem precisar rolar até o último ponto', () => {
  const pontos = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].map(rotulo => ({ rotulo, valor: 0 }))
  pontos.push({ rotulo: '2026-10 · encaminhado', valor: 1 })
  const html = renderToStaticMarkup(createElement(GraficoDados, { titulo: 'Movimentos', eixo: 'Mês', unidade: 'itens', pontos, vazio: 'Sem movimentos' }))
  expect(html).toContain('2026-10 · encaminhado')
  expect(html).toContain('Último ponto com valor:')
  expect(html).toContain('1 (itens)')
})
