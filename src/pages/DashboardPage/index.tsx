import { Button } from '../../components/Button'
import { PainelGestao } from '../../components/PainelGestao'
import { PainelPessoal } from '../../components/PainelPessoal'
import { usePainelUsuario } from '../../hooks/usePainelUsuario'

export default function DashboardPage() {
  const painel = usePainelUsuario()
  if (painel.funcionario && !painel.indicadores) return <><PainelPessoal /><Button onClick={painel.alternar}>Ver indicadores da unidade</Button></>
  return <>{painel.funcionario && <Button onClick={painel.alternar}>Voltar aos meus itens</Button>}<PainelGestao pessoal={painel.funcionario} /></>
}
