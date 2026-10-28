import estilos from '../../../styles/components/DashboardTabs/EvolucaoMovimentacoesTab.module.css'

export function EvolucaoMovimentacoesTab() {
  return (
    <section className={estilos.sourceState} aria-labelledby="fonte-evolucao">
      <h2 id="fonte-evolucao">Evolução e movimentações</h2>
      <p>O contrato atual do BFF não fornece eventos individuais nem séries de movimentação. Os gráficos aparecerão quando esses dados forem publicados pela API.</p>
    </section>
  )
}
