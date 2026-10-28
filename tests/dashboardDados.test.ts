import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { EvolucaoMovimentacoesTab } from '../src/components/DashboardTabs/EvolucaoMovimentacoesTab'
import { QualidadeDadosTab } from '../src/components/DashboardTabs/QualidadeDadosTab'
import { dashboardSnapshotMock } from '../src/mocks/dashboardSseFixture'

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
