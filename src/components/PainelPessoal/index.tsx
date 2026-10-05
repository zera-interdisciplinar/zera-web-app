import { Link } from 'react-router-dom'
import { useProdutos } from '../../hooks/useProdutos'
import { EstadoErro } from '../EstadoErro'
import { Skeleton } from '../Skeleton'
import { formatarDataRelativa } from '../../utils/formatacao'

export function PainelPessoal() {
  const itens = useProdutos()
  return <section><h1>Meus itens</h1><p>Acompanhe os itens que você cadastrou.</p>
    {itens.carregando && <Skeleton descricao="Carregando seus itens." linhas={3} />}
    {itens.erro && <EstadoErro mensagem={itens.erro} aoTentarNovamente={itens.recarregar} />}
    {itens.dados && <><p>{itens.dados.length} itens cadastrados por você.</p><ul>{itens.dados.slice(0, 10).map((item) => <li key={item.id}><Link to={`/itens/${item.id}`}>{item.nome}</Link> · {formatarDataRelativa(item.atualizacao)}</li>)}</ul></>}
    <Link className="link-botao" to="/itens">Gerenciar meus itens</Link>
  </section>
}
