import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DashboardPage from '../src/pages/DashboardPage'

afterEach(() => vi.unstubAllEnvs())

describe('dashboard de demonstração', () => {
  it('não exibe demonstração no desenvolvimento comum mesmo com as flags ligadas', () => {
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_USE_MSW', 'true')
    vi.stubEnv('VITE_DASHBOARD_DEMO_MODE', 'true')
    const tela = renderToStaticMarkup(createElement(DashboardPage, { demonstracao: true }))
    expect(tela).not.toContain('DEMONSTRAÇÃO')
    expect(tela).not.toContain('Registros fictícios')
  })
  it('permite demonstração explícita com login real e MSW desligado', () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    const tela = renderToStaticMarkup(createElement(DashboardPage, { demonstracao: true }))
    expect(tela).toContain('DEMONSTRAÇÃO')
    expect(tela).toContain('data-estado="sucesso"')
  })
  it('identifica a origem e sinaliza cada card, sem depender do login QA', () => {
    vi.stubEnv('VITE_USE_MSW', 'true')
    vi.stubEnv('VITE_DASHBOARD_DEMO_MODE', 'true')
    const tela = renderToStaticMarkup(createElement(DashboardPage))
    expect(tela).toContain('DADOS DE DEMONSTRAÇÃO · Registros fictícios para conhecer o Zera.')
    expect(tela).toContain('data-estado="sucesso"')
    expect(tela.match(/DEMONSTRAÇÃO<\/span>/g)).toHaveLength(15)
  })

  it('não usa fixture nem selo com MSW=false, mesmo se a flag do dashboard estiver ligada', () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    vi.stubEnv('VITE_DASHBOARD_DEMO_MODE', 'true')
    const tela = renderToStaticMarkup(createElement(DashboardPage))
    expect(tela).toContain('data-estado="carregando"')
    expect(tela).toContain('Consultando inventário')
    expect(tela).not.toContain('DEMONSTRAÇÃO')
    expect(tela).not.toContain('Indicadores gerais')
    expect(tela).not.toContain('Orbit Labs')
  })
})
