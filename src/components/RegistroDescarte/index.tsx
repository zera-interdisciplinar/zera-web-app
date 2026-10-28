import { Formulario } from '../Formulario'
import { useRegistroDescarte } from '../../hooks/useRegistroDescarte'
import type { RegistroDescarteProps } from '../../types/registroDescarte'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { EstadoErro } from '../EstadoErro'
import { Skeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'
import { LocaisReciclagem } from '../LocaisReciclagem'
import estilos from '../../../styles/components/RegistroDescarte/RegistroDescarte.module.css'

export function RegistroDescarte({ aoConcluir }: RegistroDescarteProps) {
  const cadastro = useRegistroDescarte(aoConcluir)
  if (!cadastro.permitido) return null
  return <section className={estilos.cartao} aria-labelledby="titulo-novo-descarte">
    <h2 id="titulo-novo-descarte" className="titulo-card">Registrar descarte</h2>
    <p>Selecione os itens e informe o destino. Ao registrar, os itens passam para descartados e ficam preservados no histórico.</p>
    <Formulario onSubmit={cadastro.salvar} noValidate className={estilos.formulario} aria-busy={cadastro.enviando}>
      <div className={estilos.campos}>
        <FieldCard id="descarte-destination" rotulo="Destino" tipo="select" valor={cadastro.form.destination} aoMudar={(valor) => cadastro.alterar('destination', valor)} desabilitado={cadastro.enviando} erro={cadastro.erros.destination} opcoes={[{ valor: 'RECYCLING', rotulo: 'Reciclagem' }, { valor: 'LANDFILL', rotulo: 'Aterro' }, { valor: 'DONATION', rotulo: 'Doação' }]} />
        <div className={estilos.data}>
          <label htmlFor="descarte-disposedAt">Data do descarte</label>
          <input id="descarte-disposedAt" type="date" max={cadastro.hoje} value={cadastro.form.disposedAt ?? ''} onChange={(evento) => cadastro.alterar('disposedAt', evento.target.value)} disabled={cadastro.enviando} aria-invalid={Boolean(cadastro.erros.disposedAt)} aria-describedby={cadastro.erros.disposedAt ? 'descarte-data-erro' : undefined} />
          {cadastro.erros.disposedAt && <p id="descarte-data-erro" role="alert" className={estilos.erro}>{cadastro.erros.disposedAt}</p>}
        </div>
      </div>
      {cadastro.form.placeId ? <div className={estilos.destino}>
        <p id="descarte-local-selecionado" tabIndex={-1}>Local selecionado: <strong>{cadastro.form.placeName}</strong></p>
        {(cadastro.erros.placeId || cadastro.erros.placeName) && <p role="alert" className={estilos.erro}>{cadastro.erros.placeId ?? cadastro.erros.placeName}</p>}
        <Button variante="secundario" onClick={cadastro.removerLocal} disabled={cadastro.enviando}>Remover local</Button>
      </div> : <FieldCard id="descarte-placeName" rotulo="Nome do local (opcional)" valor={cadastro.form.placeName ?? ''} aoMudar={(valor) => cadastro.alterar('placeName', valor)} maxLength={200} desabilitado={cadastro.enviando} erro={cadastro.erros.placeName} />}
      <FieldCard id="descarte-notes" rotulo="Observações (opcional)" tipo="textarea" valor={cadastro.form.notes ?? ''} aoMudar={(valor) => cadastro.alterar('notes', valor)} maxLength={500} desabilitado={cadastro.enviando} erro={cadastro.erros.notes} />
      <fieldset id="descarte-itemIds" tabIndex={-1} className={estilos.itens} disabled={cadastro.enviando} aria-describedby={cadastro.erros.itemIds ? 'descarte-itens-erro' : undefined}>
        <legend>Itens disponíveis para descarte</legend>
        {cadastro.itens.carregando && <Skeleton descricao="Carregando os itens disponíveis para descarte." linhas={2} />}
        {cadastro.itens.erro && <EstadoErro mensagem={cadastro.itens.erro} aoTentarNovamente={cadastro.itens.recarregar} />}
        {cadastro.itens.dados?.length === 0 && <EmptyState titulo="Nenhum item disponível" descricao="Só os itens elegíveis da unidade podem ser descartados." />}
        {cadastro.itens.dados?.map((item) => <label key={item.id} className={estilos.item} htmlFor={`descarte-item-${item.id}`}>
          <input type="checkbox" id={`descarte-item-${item.id}`} checked={cadastro.form.itemIds.includes(String(item.id))} onChange={() => cadastro.alternarItem(String(item.id))} />
          <span>{item.nome}</span>
        </label>)}
        {cadastro.erros.itemIds && <p id="descarte-itens-erro" role="alert" className={estilos.erro}>{cadastro.erros.itemIds}</p>}
      </fieldset>
      <p role="status">{cadastro.form.itemIds.length} {cadastro.form.itemIds.length === 1 ? 'item selecionado' : 'itens selecionados'}.</p>
      {cadastro.erro && <p role="alert" className={estilos.erro}>{cadastro.erro}</p>}
      <p id="descarte-sucesso" role="status" tabIndex={-1}>{cadastro.enviando ? 'Registrando descarte…' : cadastro.sucesso}</p>
      <Button type="submit" disabled={cadastro.enviando || cadastro.itens.carregando || !cadastro.itens.dados?.length}>{cadastro.enviando ? 'Registrando…' : 'Registrar descarte'}</Button>
    </Formulario>
    {cadastro.form.destination === 'RECYCLING' && !cadastro.enviando && <div className={estilos.busca}>
      <p>Se quiser, busque um ponto próximo para preencher o local do descarte.</p>
      <LocaisReciclagem aoSelecionar={cadastro.selecionarLocal} selecionadoId={cadastro.form.placeId} />
    </div>}
  </section>
}
