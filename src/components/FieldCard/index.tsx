import type { FieldCardProps } from '../../types/componentes/FieldCard'
export type { OpcaoCampo, TipoFieldCard, FieldCardProps } from '../../types/componentes/FieldCard'
import { useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import estilos from '../../../styles/components/FieldCard/FieldCard.module.css'
import { faixaDoCampo, limitarNumero } from '../../utils/limitesNumericos'

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
  obrigatorio = false,
}: FieldCardProps) {
  const faixa = faixaDoCampo(id)
  const descricao = [erro ? `${id}-erro` : '', tipo === 'numero' ? `${id}-ajuda` : ''].filter(Boolean).join(' ') || undefined
  function mudarNumero(texto: string) {
    const limitado = limitarNumero(texto, faixa)
    if (limitado !== null) aoMudar(limitado)
  }
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
        {rotulo}{obrigatorio && <span aria-label="obrigatório"> *</span>}
      </label>

      {tipo === 'select' ? (
        <select
          id={id}
          name={id}
          required={obrigatorio}
          className={estilos.controle}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao}
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
          required={obrigatorio}
          className={`${estilos.controle} ${estilos.area}`}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao}
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
              required={obrigatorio}
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
            required={obrigatorio}
            className={estilos.controle}
            type={TIPO_HTML[tipo]}
            value={valor}
            onChange={(evento) => tipo === 'numero' ? mudarNumero(evento.target.value) : aoMudar(evento.target.value)}
            inputMode={tipo === 'numero' ? faixa.step === 1 ? 'numeric' : 'decimal' : undefined}
            min={tipo === 'numero' ? faixa.min : undefined}
            max={tipo === 'numero' ? faixa.max : undefined}
            step={tipo === 'numero' ? faixa.step : undefined}
            onKeyDown={(evento) => {
              if (tipo === 'numero' && (['-', '+', 'e', 'E'].includes(evento.key) || (faixa.step === 1 && ['.', ','].includes(evento.key)))) evento.preventDefault()
            }}
            onPaste={(evento) => {
              if (tipo !== 'numero') return
              evento.preventDefault()
              mudarNumero(evento.clipboardData.getData('text'))
            }}
            onDrop={(evento) => { if (tipo === 'numero') { evento.preventDefault(); mudarNumero(evento.dataTransfer.getData('text')) } }}
            onWheel={(evento) => { if (tipo === 'numero') evento.currentTarget.blur() }}
            aria-invalid={erro ? true : undefined}
            aria-describedby={descricao}
            maxLength={maxLength}
            placeholder={placeholder}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            disabled={desabilitado}
          />
        )
      )}

      {tipo === 'numero' && <p id={`${id}-ajuda`}>{faixa.dica}</p>}
      {erro && (
        <p className={estilos.erro} id={idErro} role="alert">
          <span aria-hidden="true">⚠ </span>{erro}
        </p>
      )}
    </div>
  )
}
