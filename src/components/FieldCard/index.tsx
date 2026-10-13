import type { FieldCardProps } from '../../types/componentes/FieldCard'
export type { OpcaoCampo, TipoFieldCard, FieldCardProps } from '../../types/componentes/FieldCard'
import { useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import estilos from '../../../styles/components/FieldCard/FieldCard.module.css'

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
  icone,
  modoLogin = false,
  autoFocus = false,
}: FieldCardProps) {
  const idErro = `${id}-erro`
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const entradaRef = useRef<HTMLInputElement>(null)
  const campoClassName = `${estilos.campo} ${modoLogin ? estilos.campoLogin : ''} ${erro ? estilos.invalido : ''}`

  function alternarVisibilidade() {
    setSenhaVisivel((atual) => !atual)
    requestAnimationFrame(() => entradaRef.current?.focus({ preventScroll: true }))
  }

  return (
    <div className={campoClassName}>
      <label className={estilos.rotulo} htmlFor={id}>
        {rotulo}
      </label>

      {tipo === 'select' ? (
        <select
          id={id}
          name={id}
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
          name={id}
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
        icone || tipo === 'senha' ? (
          <div className={`${estilos.controleComIcones} ${modoLogin ? estilos.controleLogin : ''}`}>
            {icone && <span className={estilos.iconeCampo} aria-hidden="true">{icone}</span>}
            <input
              ref={entradaRef}
              id={id}
              name={id}
              className={estilos.controle}
              type={tipo === 'senha' && senhaVisivel ? 'text' : TIPO_HTML[tipo]}
              value={valor}
              onChange={(evento) => aoMudar(evento.target.value)}
              aria-invalid={erro ? true : undefined}
              aria-describedby={erro ? idErro : undefined}
              maxLength={maxLength}
              placeholder={placeholder}
              autoComplete={autoComplete}
              autoFocus={autoFocus}
              disabled={desabilitado}
            />
            {tipo === 'senha' && (
              <button
                className={estilos.alternarSenha}
                type="button"
                aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={senhaVisivel}
                aria-controls={id}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={alternarVisibilidade}
                disabled={desabilitado}
              >
                {senhaVisivel ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            )}
          </div>
        ) : (
          <input
            id={id}
            name={id}
            className={estilos.controle}
            type={TIPO_HTML[tipo]}
            value={valor}
            onChange={(evento) => aoMudar(evento.target.value)}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? idErro : undefined}
            maxLength={maxLength}
            placeholder={placeholder}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            disabled={desabilitado}
          />
        )
      )}

      {erro && (
        <p className={estilos.erro} id={idErro} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
