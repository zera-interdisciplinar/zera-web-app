import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../../../components/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { TextAreaField } from '../../../shared/ui/fields'
import { useItemAction } from '../hooks/mutations'
import { failureMessage } from '../hooks/useItemCommands'
import { rejectSchema } from '../schemas/forms'
import type { ItemResponse } from '../schemas/item'
import styles from './Items.module.css'

const MAX_REASON = 500

interface Props {
  item: ItemResponse
  onClose: () => void
  onDone: (message: string) => void
}

/** The reason is mandatory and travels to the employee who registered the item (BR-14). */
export function RejectDialog({ item, onClose, onDone }: Props) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } })
  const reason = useWatch({ control, name: 'reason' })
  const { reject } = useItemAction()
  const submit = handleSubmit(({ reason: text }) => reject.mutate({ id: item.id, reason: text }, { onSuccess: () => onDone('Item reprovado.') }))

  return (
    <Dialog open title="Reprovar item" onClose={onClose} width={32}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <p>Informe o motivo da reprovação de <strong>{item.name ?? item.displayCode ?? item.barcode}</strong>.</p>
        {reject.isError && <p role="alert" className={styles.formAlertLight}>{failureMessage(reject.error)}</p>}
        <TextAreaField label="Motivo" required rows={4} maxLength={MAX_REASON} error={errors.reason?.message}
          hint={`${reason.length}/${MAX_REASON} caracteres`} {...register('reason')} />
        <div className={styles.actions}>
          <Button variante="secundario" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variante="perigo" disabled={reject.isPending}>{reject.isPending ? 'Reprovando…' : 'Reprovar'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
