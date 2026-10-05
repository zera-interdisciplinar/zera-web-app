import { Button } from '../Button'
import estilos from './EstadoErro.module.css'

export interface EstadoErroProps {
  mensagem: string
  aoTentarNovamente?: () => void
}

export function EstadoErro({ mensagem, aoTentarNovamente }: EstadoErroProps) {
  return (
    <div className={estilos.bloco} role="alert">
      <p className={estilos.texto}>{mensagem}</p>
      {aoTentarNovamente && (
        <Button variante="secundario" tamanho="padrao" onClick={aoTentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
