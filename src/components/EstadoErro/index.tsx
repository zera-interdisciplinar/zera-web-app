import type { EstadoErroProps } from '../../types/componentes/EstadoErro'
export type { EstadoErroProps } from '../../types/componentes/EstadoErro'
import { Button } from '../Button'
import estilos from '../../../styles/components/EstadoErro/EstadoErro.module.css'

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
