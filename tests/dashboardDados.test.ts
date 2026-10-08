import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { EvolucaoMovimentacoesTab } from '../src/components/DashboardTabs/EvolucaoMovimentacoesTab'
import { QualidadeDadosTab } from '../src/components/DashboardTabs/QualidadeDadosTab'
import { dashboardSnapshotMock } from '../src/mocks/dashboardSseFixture'
import { VisaoGeralTab } from '../src/components/DashboardTabs/VisaoGeralTab'
import { GraficoDados } from '../src/components/GraficoDados'

it('exibe as séries mensais e alertas recebidos sem inventar eventos', () => {
  const snapshot = structuredClone(dashboardSnapshotMock)
  snapshot.itens_por_mes = [{ mes: '2026-10', cadastrados: 17, encaminhados: 3 }]
  snapshot.alertas = { abertos: 4, por_gravidade: [{ gravidade: 'HIGH', quantidade: 4 }] }
  const evolucao = renderToStaticMarkup(createElement(EvolucaoMovimentacoesTab, { snapshot }))
  const qualidade = renderToStaticMarkup(createElement(QualidadeDadosTab, { snapshot }))
  expect(evolucao).toContain('2026-10')
  expect(evolucao).toContain('>17<')
  expect(evolucao).toContain('>3<')
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
  const html = renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot }))
  expect(html).toContain('Ainda não há dados para exibir.')
})
