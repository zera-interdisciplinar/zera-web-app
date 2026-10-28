import { usePainelInventario } from '../../hooks/usePainelInventario'
import { formatarNumero, formatarPontosPercentuais, formatarVariacao } from '../../utils/formatarDashboard'
import estilos from '../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'
import { PesoMensal } from '../PesoMensal'
import { EstadoErro } from '../EstadoErro'

function Indicador({ titulo, valor, nota }: { titulo: string; valor: number | null; nota?: string }) {
  return <article className={estilos.kpi}><h2>{titulo}</h2><p className={estilos.valor}>{formatarNumero(valor, 2)}</p>{nota && <p className={estilos.nota}>{nota}</p>}</article>
}

export function OperacionalTab() {
  const { resumo, descartes } = usePainelInventario()
  return (
    <section className={estilos.conteudo} aria-label="Painel operacional do inventário">
      <button type="button" disabled={resumo.carregando || descartes.carregando} onClick={() => { resumo.recarregar(); descartes.recarregar() }}>Atualizar dados</button>
      {(resumo.carregando || descartes.carregando) && <p role="status">Consultando inventário…</p>}
      {resumo.erro && <EstadoErro mensagem={resumo.erro} aoTentarNovamente={resumo.recarregar} />}
      {descartes.erro && <EstadoErro mensagem={descartes.erro} aoTentarNovamente={descartes.recarregar} />}
      {!resumo.carregando && resumo.dados && <div className={estilos.gradeKpis}>
        <Indicador titulo="Itens ativos" valor={resumo.dados.activeItems} nota={formatarVariacao(resumo.dados.activeItemsChangePercent)} />
        <Indicador titulo="Aguardando aprovação" valor={resumo.dados.pendingApproval} />
        <Indicador titulo="Em manutenção" valor={resumo.dados.inMaintenance} />
        <Indicador titulo="Aguardando avaliação" valor={resumo.dados.awaitingEvaluation} />
          <Indicador titulo="Descartes no período" valor={resumo.dados.disposalsInWindow} />
      </div>}
      {!descartes.carregando && descartes.dados && <>
        <div className={estilos.gradeKpis}>
          <Indicador titulo="Peso total descartado (kg)" valor={descartes.dados.totalWeightKg} nota={formatarVariacao(descartes.dados.totalWeightChangePercent)} />
          <Indicador titulo="Taxa de reciclagem (%)" valor={descartes.dados.recyclingRatePercent} nota={formatarPontosPercentuais(descartes.dados.recyclingRateChangePoints)} />
        </div>
        <PesoMensal pontos={descartes.dados.monthlyWeightKg} />
      </>}
    </section>
  )
}
