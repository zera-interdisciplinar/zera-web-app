import estilos from '../../../styles/components/DashboardTabs/ItensVidaUtilTab.module.css'

export function ItensVidaUtilTab() {
  return (
    <section className={estilos.sourceState} aria-labelledby="fonte-vida-util">
      <h2 id="fonte-vida-util">Aguardando contrato da API</h2>
      <p>O endpoint de analytics atual não envia dados individuais de idade, peso, vida útil, garantia ou condição. Nenhum dado estimado é exibido.</p>
    </section>
  )
}
