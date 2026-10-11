import { Button } from '../../components/Button'
import { DashboardDemo } from '../../components/DashboardDemo'
import { PainelGestao } from '../../components/PainelGestao'
import { PainelPessoal } from '../../components/PainelPessoal'
import { dashboardDemoEnabled } from '../../config/dashboardMode'
import { usePainelUsuario } from '../../hooks/usePainelUsuario'
import type { DashboardPageProps } from '../../types/componentes/DashboardPage'


export default function DashboardPage({ demonstracao = false }: DashboardPageProps = {}) {
  const painel = usePainelUsuario()
  if (import.meta.env.DEV && import.meta.env.MODE === 'test' && (demonstracao || dashboardDemoEnabled())) return <DashboardDemo />
  if (painel.funcionario && !painel.indicadores) return <><PainelPessoal /><Button onClick={painel.alternar}>Ver indicadores da unidade</Button></>
  return <>{painel.funcionario && <Button onClick={painel.alternar}>Voltar aos meus itens</Button>}<PainelGestao pessoal={painel.funcionario} /></>
}
