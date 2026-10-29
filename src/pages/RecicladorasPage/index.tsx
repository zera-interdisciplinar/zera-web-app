import { CadastroRecicladoras } from '../../components/CadastroRecicladoras'
import { LocaisReciclagem } from '../../components/LocaisReciclagem'
import { PageHeader } from '../../components/PageHeader'
import { useAmbiente } from '../../hooks/useAmbiente'

export default function RecicladorasPage() {
  const { modoDemonstracao } = useAmbiente()

  if (!modoDemonstracao) return <>
    <PageHeader titulo="Locais de reciclagem" subtitulo="Consulte pontos próximos para planejar o destino dos itens." />
    <LocaisReciclagem />
    <CadastroRecicladoras />
  </>
  return <CadastroRecicladoras />
}
