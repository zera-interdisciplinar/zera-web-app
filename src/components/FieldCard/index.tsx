import estilos from './FieldCard.module.css'

export interface OpcaoCampo {
  valor: string
  rotulo: string
}

export type TipoFieldCard = 'texto' | 'email' | 'senha' | 'numero' | 'select' | 'textarea'

export interface FieldCardProps {
  id: string
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  tipo?: TipoFieldCard
  opcoes?: OpcaoCampo[]
  erro?: string
  placeholder?: string
  maxLength?: number
  autoComplete?: string
  desabilitado?: boolean
}

const TIPO_HTML: Record<string, string> = {
  texto: 'text',
  email: 'email',
  senha: 'password',
  numero: 'number',
}

export function FieldCard({
  id,
  rotulo,
  valor,
  aoMudar,
  tipo = 'texto',
  opcoes = [],
  erro,
  placeholder,
  maxLength,
  autoComplete,
  desabilitado = false,
}: FieldCardProps) {
  const idErro = `${id}-erro`

  return (
    <div className={`${estilos.campo} ${erro ? estilos.invalido : ''}`}>
      <label className={estilos.rotulo} htmlFor={id}>
        {rotulo}
      </label>

      {tipo === 'select' ? (
        <select
          id={id}
          className={estilos.controle}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          disabled={desabilitado}
        >
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      ) : tipo === 'textarea' ? (
        <textarea
          id={id}
          className={`${estilos.controle} ${estilos.area}`}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={desabilitado}
          rows={3}
        />
      ) : (
        <input
          id={id}
          className={estilos.controle}
          type={TIPO_HTML[tipo]}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={desabilitado}
        />
      )}

      {erro && (
        <p className={estilos.erro} id={idErro} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
