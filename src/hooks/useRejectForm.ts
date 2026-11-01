import { useForm,useWatch } from 'react-hook-form'
import type { RejectDialogProps } from '../types/componentes/RejectDialog'
import { rejectSchema } from '../utils/itemValidation'
import { resolverFor } from '../utils/validation'
import { useItemAction } from './useItemMutations'



export function useRejectForm({ item, onDone }: RejectDialogProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<{ reason: string }>({ resolver: resolverFor(rejectSchema), defaultValues: { reason: '' } })
  const reason = useWatch({ control, name: 'reason' })
  const { reject } = useItemAction()
  const submit = handleSubmit(({ reason: text }) => reject.mutate({ id: item.id, reason: text }, { onSuccess: () => onDone('Item reprovado.') }))

  return { register, errors, reason, reject, submit }
}
