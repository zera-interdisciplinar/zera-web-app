import { Component } from 'react'
import type { LimiteErroProps, LimiteErroState } from '../../types/erro'

export class LimiteErro extends Component<LimiteErroProps, LimiteErroState> {
  state: LimiteErroState = { falhou: false }

  static getDerivedStateFromError(): LimiteErroState {
    return { falhou: true }
  }

  render() {
    if (this.state.falhou) {
      return <main id="conteudo" className="pagina-falha">
        <h1>Não foi possível abrir esta página</h1>
        <p role="alert">Recarregue para tentar novamente. Se o problema continuar, entre em contato com a equipe do ZERA.</p>
        <button type="button" className="link-botao" onClick={() => location.reload()}>Recarregar página</button>
      </main>
    }
    return this.props.children
  }
}
