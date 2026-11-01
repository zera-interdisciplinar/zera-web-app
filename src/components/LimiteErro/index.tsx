import { Component } from 'react'
import type { LimiteErroProps, LimiteErroState } from '../../types/erro'
import { FeedbackPage } from '../FeedbackPage'

export class LimiteErro extends Component<LimiteErroProps, LimiteErroState> {
  state: LimiteErroState = { falhou: false }

  static getDerivedStateFromError(): LimiteErroState {
    return { falhou: true }
  }

  componentDidCatch(): void {
    document.getElementById('conteudo')?.focus()
  }

  render() {
    if (this.state.falhou) {
      return <FeedbackPage>
        <h1>Não foi possível abrir esta página</h1>
        <p role="alert">Recarregue para tentar novamente. Se o problema continuar, entre em contato com a equipe do ZERA.</p>
        <button type="button" className="link-botao" onClick={() => location.reload()}>Recarregar página</button>
      </FeedbackPage>
    }
    return this.props.children
  }
}
