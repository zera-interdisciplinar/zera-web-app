import estilos from '../../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'
import { usePainelInventario } from '../../../hooks/usePainelInventario'
import { formatarPontosPercentuais, formatarVariacao } from '../../../utils/formatarDashboard'
import { EstadoErro } from '../../EstadoErro'
import { IndicadorInventario } from '../../IndicadorInventario'
import { PesoMensal } from '../../PesoMensal'

export function OperacionalTab() {
  const { resumo, descartes } = usePainelInventario()
  return (
    <section className={estilos.conteudo} aria-label="Painel operacional do inventário" data-estado={resumo.carregando || descartes.carregando ? 'carregando' : resumo.erro || descartes.erro ? 'erro' : 'sucesso'}>
      <button type="button" disabled={resumo.carregando || descartes.carregando} onClick={() => { resumo.recarregar(); descartes.recarregar() }}>Atualizar dados</button>
      {(resumo.carregando || descartes.carregando) && <p role="status">Consultando inventário…</p>}
      {resumo.erro && <EstadoErro mensagem={resumo.erro} aoTentarNovamente={resumo.recarregar} />}
      {descartes.erro && <EstadoErro mensagem={descartes.erro} aoTentarNovamente={descartes.recarregar} />}
      {!resumo.carregando && resumo.dados && <div className={estilos.gradeKpis}>
        <IndicadorInventario titulo="Itens ativos" valor={resumo.dados.activeItems} nota={formatarVariacao(resumo.dados.activeItemsChangePercent)} />
        <IndicadorInventario titulo="Aguardando aprovação" valor={resumo.dados.pendingApproval} />
        <IndicadorInventario titulo="Em manutenção" valor={resumo.dados.inMaintenance} />
        <IndicadorInventario titulo="Aguardando avaliação" valor={resumo.dados.awaitingEvaluation} />
          <IndicadorInventario titulo="Descartes no período" valor={resumo.dados.disposalsInWindow} />
      </div>}
      {!descartes.carregando && descartes.dados && <>
        <div className={estilos.gradeKpis}>
          <IndicadorInventario titulo="Peso total descartado (kg)" valor={descartes.dados.totalWeightKg} nota={formatarVariacao(descartes.dados.totalWeightChangePercent)} />
          <IndicadorInventario titulo="Taxa de reciclagem (%)" valor={descartes.dados.recyclingRatePercent} nota={formatarPontosPercentuais(descartes.dados.recyclingRateChangePoints)} />
        </div>
        <PesoMensal pontos={descartes.dados.monthlyWeightKg} />
      </>}
    </section>
  )
}
