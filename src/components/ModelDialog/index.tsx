import { useForm } from 'react-hook-form'
import { Button } from '../Button'
import { describeApiError } from '../../utils/apiError'
import { Dialog } from '../Dialog'
import { ChoiceGroup } from '../ChoiceGroup'
import { SelectField } from '../SelectField'
import { TextAreaField } from '../TextAreaField'
import { TextField } from '../TextField'
import { useCategories } from '../../hooks/useItemQueries'
import { MATERIAL_LABEL } from '../../utils/itemLabels'
import { MATERIAL_CODES } from '../../utils/itemSchemas'
import { useModelActions } from '../../hooks/useModelMutations'
import { toCreateModelRequest, toModelPatches } from '../../utils/modelRequests'
import { modelFormSchema } from '../../utils/modelValidation'
import styles from '../../../styles/components/Models/Models.module.css'
import type { ModelDialogProps } from '../../types/componentes/ModelDialog'
import type { Model } from '../../types/item'
import type { ModelFormInput, ModelFormValues } from '../../types/model'
import { resolverFor } from '../../utils/validation'
import { useDiscardGuard } from '../../hooks/useDiscardGuard'
import { ConfirmDialog } from '../ConfirmDialog'
import { ChoiceOption } from '../ChoiceOption'

function defaultsFor(model?: Model): ModelFormInput {
  return {
    name: model?.name ?? '', manufacturer: model?.manufacturer ?? '', categoryId: model?.category.id ?? '',
    materials: model?.materials.map((material) => material.code) ?? [], estimatedWeightKg: model?.estimatedWeightKg ?? '',
    warrantyMonths: model?.warrantyMonths ?? '', expectedLifespanMonths: model?.expectedLifespanMonths ?? '', notes: model?.notes ?? '',
  }
}

export function ModelDialog({ model, onClose, onDone }: ModelDialogProps) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ModelFormInput, unknown, ModelFormValues>({ resolver: resolverFor(modelFormSchema), defaultValues: defaultsFor(model) })
  const categories = useCategories()
  const actions = useModelActions()
  const pending = actions.create.isPending || actions.edit.isPending
  const failure = actions.create.error ?? actions.edit.error

  const { asking, requestClose, confirmDiscard, keepEditing } = useDiscardGuard(isDirty, onClose)

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
    <>
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
            {MATERIAL_CODES.map((code) => <ChoiceOption key={code} type="checkbox" value={code} label={MATERIAL_LABEL[code]} {...register('materials')} />)}
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
      {asking && <ConfirmDialog title="Descartar alterações?" message="Descartar as alterações? O que foi digitado será perdido." confirmLabel="Descartar" cancelLabel="Continuar editando" onConfirm={confirmDiscard} onCancel={keepEditing} />}
    </>
  )
}
