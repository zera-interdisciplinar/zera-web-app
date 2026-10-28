import estilos from '../../../styles/components/DashboardTabs/QualidadeDadosTab.module.css'

export function QualidadeDadosTab() {
  return (
    <section className={estilos.semFonte} aria-labelledby="fonte-qualidade">
      <h2 id="fonte-qualidade">Qualidade dos dados e alertas</h2>
      <p>O BFF fornece somente a contagem de alertas abertos e a distribuição por gravidade, já exibidas na visão geral. Não há dados de preenchimento nem histórico de resolução no contrato atual.</p>
    </section>
  )
}
