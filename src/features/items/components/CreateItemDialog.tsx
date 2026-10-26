import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../../../components/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { ChoiceGroup, SelectField, TextField } from '../../../shared/ui/fields'
import { useCreateItem } from '../hooks/mutations'
import { useCategories, useModelOptions } from '../hooks/queries'
import { toFormFailure } from '../model/formErrors'
import { MATERIAL_LABEL } from '../model/labels'
import { toCreateRequest } from '../model/requests'
import { createItemSchema, type CreateItemInput, type CreateItemValues } from '../schemas/forms'
import { MATERIAL_CODES, type ItemResponse } from '../schemas/item'
import { ItemFields, type ItemFieldErrors } from './ItemFields'
import styles from './Items.module.css'

interface Props {
  onClose: () => void
  onCreated: (message: string) => void
  /** The item was saved as a draft because the submit asked for more data; the form continues in edit mode. */
  onDraft: (item: ItemResponse, missingFields: string[]) => void
}

const defaults: CreateItemInput = {
  barcode: '', modelMode: 'existing', modelId: '', model: { name: '', manufacturer: '', categoryId: '', materials: [], estimatedWeightKg: '' },
  name: '', condition: '' as never, hasDamages: '' as never, damages: [], usageIntensity: '', serialNumber: '', acquiredAt: '', manufacturingYear: '', notes: '',
}

export function CreateItemDialog({ onClose, onCreated, onDraft }: Props) {
  // One id per opened form: a resend after a timeout reaches the server as the same item (idempotent create).
  const [itemId] = useState(() => crypto.randomUUID())
  const { register, handleSubmit, control, setError, formState: { errors, isDirty } } = useForm<CreateItemInput, unknown, CreateItemValues>({
    resolver: zodResolver(createItemSchema), defaultValues: defaults,
  })
  const [modelMode, hasDamages] = useWatch({ control, name: ['modelMode', 'hasDamages'] })
  const models = useModelOptions()
  const categories = useCategories()
  const create = useCreateItem()
  const general = create.error ? toFormFailure(create.error, 'create').general : undefined

  function requestClose() {
    if (!isDirty || window.confirm('Descartar o cadastro em andamento?')) onClose()
  }

  const submit = handleSubmit((values) => {
    create.mutate(toCreateRequest(values, itemId), {
      onSuccess: (result) => {
        if (result.submitted) onCreated('Item cadastrado e incluído no estoque.')
        else onDraft(result.item, result.missingFields)
      },
      onError: (error) => {
        const failure = toFormFailure(error, 'create')
        for (const [path, message] of Object.entries(failure.fields)) setError(path as 'barcode', { message })
      },
    })
  })

  const modelErrors = errors.model
  const total = models.data?.totalElements ?? 0
  const shown = models.data?.content.length ?? 0

  return (
    <Dialog open title="Adicionar item" tone="navy" width={44} onClose={requestClose}>
      <form className={styles.form} onSubmit={submit} noValidate>
        {general && <p role="alert" className={styles.formAlert}>{general}</p>}
        <TextField tone="navy" label="Código de barras" required maxLength={128} autoComplete="off" error={errors.barcode?.message} {...register('barcode')} />

        <ChoiceGroup tone="navy" legend="Modelo" required>
          <label><input type="radio" value="existing" {...register('modelMode')} /> Modelo existente</label>
          <label><input type="radio" value="new" {...register('modelMode')} /> Novo modelo</label>
        </ChoiceGroup>

        {modelMode === 'existing' ? (
          <SelectField tone="navy" label="Selecione o modelo" required error={errors.modelId?.message}
            hint={models.isError ? 'Não foi possível carregar os modelos. Tente novamente mais tarde.' : total > shown ? `Mostrando ${shown} de ${total} modelos. Para os demais, cadastre um novo modelo.` : undefined}
            {...register('modelId')}>
            <option value="">{models.isPending ? 'Carregando…' : 'Selecione'}</option>
            {models.data?.content.map((model) => <option key={model.id} value={model.id}>{model.name} — {model.manufacturer} ({model.category.name})</option>)}
          </SelectField>
        ) : (
          <fieldset className={styles.subform}>
            <legend>Novo modelo</legend>
            <SelectField tone="navy" label="Categoria" required error={modelErrors?.categoryId?.message}
              hint={categories.isError ? 'Não foi possível carregar as categorias.' : undefined} {...register('model.categoryId')}>
              <option value="">{categories.isPending ? 'Carregando…' : 'Selecione'}</option>
              {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </SelectField>
            <TextField tone="navy" label="Nome do modelo" required maxLength={120} error={modelErrors?.name?.message} {...register('model.name')} />
            <TextField tone="navy" label="Fabricante" required maxLength={120} error={modelErrors?.manufacturer?.message} {...register('model.manufacturer')} />
            <ChoiceGroup tone="navy" legend="Materiais" required error={(modelErrors?.materials as { message?: string } | undefined)?.message}>
              {MATERIAL_CODES.map((code) => <label key={code}><input type="checkbox" value={code} {...register('model.materials')} /> {MATERIAL_LABEL[code]}</label>)}
            </ChoiceGroup>
            <TextField tone="navy" label="Peso estimado (kg)" type="number" min={0} step="any" inputMode="decimal" error={modelErrors?.estimatedWeightKg?.message} {...register('model.estimatedWeightKg')} />
          </fieldset>
        )}

        <ItemFields register={(name) => register(name)} errors={errors as ItemFieldErrors} hasDamages={hasDamages} />
        <div className={styles.actions}>
          <Button variante="secundario" onClick={requestClose}>Cancelar</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Salvando…' : 'Concluir cadastro'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
