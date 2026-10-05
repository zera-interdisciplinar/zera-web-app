import { Formulario } from '../Formulario'
import { Button } from '../Button'
import { EmptyState } from '../EmptyState'
import { useLocaisReciclagem } from '../../hooks/useLocaisReciclagem'
import type { LocaisReciclagemProps } from '../../types/locaisReciclagem'
import estilos from '../../../styles/components/LocaisReciclagem/LocaisReciclagem.module.css'

const CAMPOS = [
  { nome: 'lat', rotulo: 'Latitude', min: -90, max: 90, step: 'any', exemplo: '-23.5505' },
  { nome: 'lng', rotulo: 'Longitude', min: -180, max: 180, step: 'any', exemplo: '-46.6333' },
  { nome: 'radiusMeters', rotulo: 'Raio em metros (opcional)', min: 1, max: undefined, step: '1', exemplo: '5000' },
] as const

export function LocaisReciclagem({ aoSelecionar, selecionadoId }: LocaisReciclagemProps) {
  const busca = useLocaisReciclagem()
  return <section className={estilos.cartao} aria-label="Buscar locais de reciclagem">
    <h2 className="titulo-card">Encontre um local próximo</h2>
    <p className={estilos.instrucao}>Use sua localização ou informe as coordenadas de referência. O raio é opcional; 1.000 metros equivalem a 1 km.</p>
    <Button variante="secundario" onClick={busca.usarLocalizacao} disabled={busca.localizando || busca.carregando}>{busca.localizando ? 'Obtendo localização…' : 'Usar minha localização'}</Button>
    <p role="status">{busca.feedbackLocalizacao}</p>
    {busca.erroLocalizacao && <p role="alert" className={estilos.erro}>{busca.erroLocalizacao}</p>}
    <Formulario onSubmit={busca.buscar} noValidate className={estilos.formulario} aria-busy={busca.carregando}>
      <div className={estilos.campos}>
        {CAMPOS.map((campo) => <div key={campo.nome} className={estilos.campo}>
          <label htmlFor={`locais-${campo.nome}`}>{campo.rotulo}</label>
          <input id={`locais-${campo.nome}`} type="number" value={busca.form[campo.nome]}
            onChange={(evento) => busca.alterar(campo.nome, evento.target.value)} step={campo.step}
            min={campo.min} max={campo.max} placeholder={campo.exemplo} disabled={busca.carregando}
            aria-invalid={Boolean(busca.erros[campo.nome])} aria-describedby={busca.erros[campo.nome] ? `locais-${campo.nome}-erro` : undefined} />
          {busca.erros[campo.nome] && <p id={`locais-${campo.nome}-erro`} role="alert" className={estilos.erro}>{busca.erros[campo.nome]}</p>}
        </div>)}
      </div>
      <Button type="submit" disabled={busca.carregando || busca.localizando}>{busca.carregando ? 'Buscando locais…' : 'Buscar locais'}</Button>
    </Formulario>
    <p role="status" className={estilos.feedback}>{busca.carregando ? 'Consultando os locais próximos…' : busca.locais ? `${busca.locais.length} ${busca.locais.length === 1 ? 'local encontrado' : 'locais encontrados'}.` : ''}</p>
    {busca.erro && <p role="alert" className={estilos.erro}>{busca.erro} Tente novamente pelo botão de busca.</p>}
    {busca.locais?.length === 0 && <EmptyState titulo="Nenhum local encontrado" descricao="Confira as coordenadas ou aumente o raio da busca." />}
    {busca.locais && busca.locais.length > 0 && <ul className={estilos.lista}>
      {busca.locais.map((local) => <li key={local.placeId} className={estilos.local}>
        <h3>{local.name}</h3>
        <p>{local.address || 'Endereço não informado.'}</p>
        <p className={estilos.distancia}>{(local.distanceMeters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km da referência</p>
        {local.description && <p>{local.description}</p>}
        <p>{local.isOpen === null ? 'Funcionamento não informado.' : local.isOpen ? 'Aberto no momento da consulta.' : 'Fechado no momento da consulta.'}</p>
        <p className={estilos.instrucao}>Confirme os materiais aceitos e o horário antes de levar os itens.</p>
        {aoSelecionar && <Button variante="secundario" aria-pressed={selecionadoId === local.placeId} onClick={() => aoSelecionar(local)}>{selecionadoId === local.placeId ? 'Local selecionado' : `Selecionar ${local.name}`}</Button>}
      </li>)}
    </ul>}
  </section>
}
