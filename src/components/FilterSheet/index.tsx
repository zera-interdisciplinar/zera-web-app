import { SlidersHorizontal, X } from 'lucide-react'
import type { FilterSheetProps } from '../../types/componentes/FilterSheet'
import { useFilterSheet } from '../../hooks/useFilterSheet'
import { Dialog } from '../Dialog'
import { Button } from '../Button'
import styles from '../../../styles/components/FilterSheet/FilterSheet.module.css'

export function FilterSheet(props: FilterSheetProps) {
  const { state, open, close, toggle, reset, apply } = useFilterSheet(props)
  const selected = props.groups.flatMap((group) => group.selected.map((value) => ({ group, value, label: group.options.find((option) => option.value === value)?.label ?? value })))
  const activeCount = selected.filter(({ group }) => !group.required).length
  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.trigger} aria-haspopup="dialog" aria-expanded={state.open} onClick={open}><SlidersHorizontal size={18} aria-hidden="true" />Filtros{activeCount > 0 && <span>{activeCount}</span>}</button>
      {selected.map(({ group, value, label }) => group.required ? <span key={`${group.id}-${value}`} className={styles.applied}>{label}</span> : <button key={`${group.id}-${value}`} type="button" className={styles.applied} aria-label={`Remover filtro ${label}`} onClick={() => props.onApply(Object.fromEntries(props.groups.map((entry) => [entry.id, entry.id === group.id ? entry.selected.filter((current) => current !== value) : entry.selected])))}>{label}<X size={14} aria-hidden="true" /></button>)}
      {activeCount > 0 && <button type="button" className={styles.clear} onClick={props.onClear}>Limpar filtros</button>}
      <Dialog open={state.open} title={props.title} onClose={close} width={42}>
        <p className={styles.intro}>Escolha as opções e aplique para atualizar os resultados.</p>
        <div className={styles.groups}>
          {props.groups.map((group) => <fieldset className={styles.group} key={group.id}><legend>{group.label}</legend><div className={styles.options}>{group.options.map((option) => <button key={option.value} type="button" className={styles.option} aria-pressed={(state.draft[group.id] ?? []).includes(option.value)} onClick={() => toggle(group, option.value)}>{option.label}{(state.draft[group.id] ?? []).includes(option.value) && <X size={14} aria-hidden="true" />}</button>)}</div>{!group.options.length && <p className={styles.intro}>Nenhuma opção disponível.</p>}</fieldset>)}
        </div>
        <div className={styles.actions}><Button variante="secundario" onClick={reset}>Limpar seleção</Button><Button onClick={apply}>Aplicar filtros</Button></div>
      </Dialog>
    </div>
  )
}
