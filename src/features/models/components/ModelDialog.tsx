import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '../../../components/Button'
import { describeApiError } from '../../../shared/api/errors'
import { Dialog } from '../../../shared/ui/Dialog'
import { ChoiceGroup, SelectField, TextAreaField, TextField } from '../../../shared/ui/fields'
import { useCategories } from '../../items/hooks/queries'
import { MATERIAL_LABEL } from '../../items/model/labels'
import { MATERIAL_CODES, type Model } from '../../items/schemas/item'
import { useModelActions } from '../hooks/mutations'
import { toCreateModelRequest, toModelPatches } from '../model/requests'
import { modelFormSchema, type ModelFormInput, type ModelFormValues } from '../schemas/forms'
import styles from './Models.module.css'

interface Props {
  /** Present when editing. Category, weight and notes have no PATCH in the API, so they stay read-only. */
  model?: Model
  onClose: () => void
  onDone: (message: string) => void
}

function defaultsFor(model?: Model): ModelFormInput {
  return {
    name: model?.name ?? '', manufacturer: model?.manufacturer ?? '', categoryId: model?.category.id ?? '',
    materials: model?.materials.map((material) => material.code) ?? [], estimatedWeightKg: model?.estimatedWeightKg ?? '',
    warrantyMonths: model?.warrantyMonths ?? '', expectedLifespanMonths: model?.expectedLifespanMonths ?? '', notes: model?.notes ?? '',
  }
}

export function ModelDialog({ model, onClose, onDone }: Props) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ModelFormInput, unknown, ModelFormValues>({ resolver: zodResolver(modelFormSchema), defaultValues: defaultsFor(model) })
  const categories = useCategories()
  const actions = useModelActions()
  const pending = actions.create.isPending || actions.edit.isPending
  const failure = actions.create.error ?? actions.edit.error

  function requestClose() {
    if (!isDirty || window.confirm('Descartar as alterações?')) onClose()
  }

  const submit = handleSubmit((values) => {
    if (!model) {
      actions.create.mutate(toCreateModelRequest(values), { onSuccess: () => onDone('Modelo cadastrado.') })
      return
    }
    const patches = toModelPatches(model, values)
    if (patches.length === 0) { onClose(); return }
    actions.edit.mutate({ id: model.id, patches }, { onSuccess: () => onDone('Modelo atualizado.') })
  })

  return (
    <Dialog open title={model ? 'Editar modelo' : 'Novo modelo'} tone="navy" width={40} onClose={requestClose}>
      <form className={styles.form} onSubmit={submit} noValidate>
        {failure && <p role="alert" className={styles.formAlert}>{describeApiError(failure)}</p>}
        <TextField tone="navy" label="Nome do modelo" required maxLength={120} error={errors.name?.message} {...register('name')} />
        <TextField tone="navy" label="Fabricante" required maxLength={120} error={errors.manufacturer?.message} {...register('manufacturer')} />
        {model ? (
          <p className={styles.readonly}>Categoria: <strong>{model.category.name}</strong> · não pode ser alterada depois do cadastro.</p>
        ) : (
          <SelectField tone="navy" label="Categoria" required error={errors.categoryId?.message} hint={categories.isError ? 'Não foi possível carregar as categorias.' : undefined} {...register('categoryId')}>
            <option value="">{categories.isPending ? 'Carregando…' : 'Selecione'}</option>
            {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectField>
        )}
        <ChoiceGroup tone="navy" legend="Materiais" required error={errors.materials?.message}>
          {MATERIAL_CODES.map((code) => <label key={code}><input type="checkbox" value={code} {...register('materials')} /> {MATERIAL_LABEL[code]}</label>)}
        </ChoiceGroup>
        {!model && <TextField tone="navy" label="Peso estimado (kg)" type="number" min={0} step="any" inputMode="decimal" error={errors.estimatedWeightKg?.message} {...register('estimatedWeightKg')} />}
        <TextField tone="navy" label="Garantia (meses)" type="number" min={1} step={1} inputMode="numeric" error={errors.warrantyMonths?.message}
          hint={model ? 'Um valor já informado só pode ser trocado, não apagado.' : undefined} {...register('warrantyMonths')} />
        <TextField tone="navy" label="Vida útil esperada (meses)" type="number" min={1} step={1} inputMode="numeric" error={errors.expectedLifespanMonths?.message}
          hint={model ? 'Um valor já informado só pode ser trocado, não apagado.' : undefined} {...register('expectedLifespanMonths')} />
        {!model && <TextAreaField tone="navy" label="Observações" maxLength={500} error={errors.notes?.message} {...register('notes')} />}
        <div className={styles.actions}>
          <Button variante="secundario" onClick={requestClose}>Cancelar</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : model ? 'Salvar alterações' : 'Cadastrar modelo'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
