import type { FluxoItemRealProps } from '../../types/transicaoItem'
import { ROTULO_TRANSICAO } from '../../types/transicaoItem'
import { useTransicaoItem } from '../../hooks/useTransicaoItem'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Modal } from '../Modal'

const CONDICOES = [
  { valor: 'NEW', rotulo: 'Novo' }, { valor: 'USED', rotulo: 'Usado' },
  { valor: 'SEMI_DAMAGED', rotulo: 'Semidanificado' }, { valor: 'DAMAGED', rotulo: 'Danificado' },
]

export function FluxoItemReal({ item, aoConcluir }: FluxoItemRealProps) {
  const fluxo = useTransicaoItem(item, aoConcluir)
  return <section aria-label="Próximas etapas do item">
    <h2 className="titulo-card">Próximas etapas</h2>
    {fluxo.acoes.map((acao) => <Button key={acao} variante={acao === 'reject' ? 'perigo' : 'secundario'} onClick={() => fluxo.selecionar(acao)} disabled={fluxo.enviando}>{ROTULO_TRANSICAO[acao]}</Button>)}
    {fluxo.acoes.length === 0 && <p>Não há etapas disponíveis para este estado e perfil de acesso.</p>}
    <p role="status" tabIndex={-1} ref={fluxo.acao ? undefined : fluxo.feedbackRef}>{fluxo.sucesso}</p>
    <Modal aberto={fluxo.acao !== null} titulo={fluxo.acao ? ROTULO_TRANSICAO[fluxo.acao] : 'Atualizar item'} aoFechar={fluxo.fechar}>
      <form onSubmit={fluxo.confirmar} noValidate aria-busy={fluxo.enviando}>
        <p>Confirme a atualização de {item.nome}. O histórico do item registrará esta etapa.</p>
        {(fluxo.acao === 'reject' || fluxo.acao === 'maintenance/start') && <FieldCard id="fluxo-item-motivo" rotulo="Motivo" tipo="textarea" valor={fluxo.dados.reason} aoMudar={(valor) => fluxo.alterar('reason', valor)} maxLength={500} erro={fluxo.erros.reason} desabilitado={fluxo.enviando} />}
        {fluxo.acao === 'evaluate' && <FieldCard id="fluxo-item-condicao" rotulo="Condição após a manutenção" tipo="select" valor={fluxo.dados.condition} aoMudar={(valor) => fluxo.alterar('condition', valor)} opcoes={CONDICOES} erro={fluxo.erros.condition} desabilitado={fluxo.enviando} />}
        <p ref={fluxo.acao ? fluxo.feedbackRef : undefined} tabIndex={-1} role={fluxo.erro ? 'alert' : 'status'}>{fluxo.erro ?? (fluxo.enviando ? 'Atualizando item…' : '')}</p>
        <Button type="submit" disabled={fluxo.enviando}>{fluxo.enviando ? 'Atualizando…' : 'Confirmar'}</Button>
        <Button variante="secundario" onClick={fluxo.fechar} disabled={fluxo.enviando}>Cancelar</Button>
      </form>
    </Modal>
  </section>
}
