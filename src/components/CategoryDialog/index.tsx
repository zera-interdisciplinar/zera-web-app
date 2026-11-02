import styles from '../../../styles/components/Models/Models.module.css'
import { useCategoryForm } from '../../hooks/useCategoryForm'
import type { CategoryDialogProps } from '../../types/componentes/CategoryDialog'
import { describeApiError } from '../../utils/apiError'
import { Button } from '../Button'
import { ConfirmDialog } from '../ConfirmDialog'
import { Dialog } from '../Dialog'
import { TextAreaField } from '../TextAreaField'
import { TextField } from '../TextField'

export function CategoryDialog({ category, onClose, onDone }: CategoryDialogProps) {
  const { register, errors, pending, failure, asking, requestClose, confirmDiscard, keepEditing, submit } = useCategoryForm({ category, onClose, onDone })

  return (
    <>
      <Dialog open title={category ? 'Editar categoria' : 'Nova categoria'} description={category ? 'Altere o nome ou a descrição da categoria.' : 'Informe o nome e a descrição da categoria.'} tone="navy" width={32} onClose={requestClose}>
        <form className={styles.form} onSubmit={submit} noValidate>
          {failure && <p role="alert" className={styles.formAlert}>{describeApiError(failure)}</p>}
          <TextField tone="navy" label="Nome" required maxLength={120} error={errors.name?.message} {...register('name')} />
          <TextAreaField tone="navy" label="Descrição" required maxLength={500} error={errors.description?.message} {...register('description')} />
          <div className={styles.actions}>
            <Button variante="secundario" onClick={requestClose}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : category ? 'Salvar alterações' : 'Criar categoria'}</Button>
          </div>
        </form>
      </Dialog>
      {asking && <ConfirmDialog title="Descartar alterações?" message="Descartar as alterações? O que foi digitado será perdido." confirmLabel="Descartar" cancelLabel="Continuar editando" onConfirm={confirmDiscard} onCancel={keepEditing} />}
    </>
  )
}
