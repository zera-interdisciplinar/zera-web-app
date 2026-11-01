import styles from '../../../styles/components/Items/Items.module.css'
import { useCreateItemForm } from '../../hooks/useCreateItemForm'
import type { CreateItemDialogProps } from '../../types/componentes/CreateItemDialog'
import type { ItemFieldErrors } from '../../types/item'
import { MATERIAL_LABEL } from '../../utils/itemLabels'
import { MATERIAL_CODES } from '../../utils/itemSchemas'
import { Button } from '../Button'
import { ChoiceGroup } from '../ChoiceGroup'
import { ChoiceOption } from '../ChoiceOption'
import { ConfirmDialog } from '../ConfirmDialog'
import { Dialog } from '../Dialog'
import { ItemFields } from '../ItemFields'
import { SelectField } from '../SelectField'
import { TextField } from '../TextField'


export function CreateItemDialog({ onClose, onCreated, onDraft }: CreateItemDialogProps) {
  const { register, errors, modelMode, hasDamages, models, categories, create, general, asking, requestClose, confirmDiscard, keepEditing, submit, modelErrors, total, shown } = useCreateItemForm({ onClose, onCreated, onDraft })

  return (
    <>
      <Dialog open title="Adicionar item" tone="navy" width={44} onClose={requestClose}>
        <form className={styles.form} onSubmit={submit} noValidate>
          {general && <p role="alert" className={styles.formAlert}>{general}</p>}
          <TextField tone="navy" label="Código de barras" required maxLength={128} autoComplete="off" error={errors.barcode?.message} {...register('barcode')} />

          <ChoiceGroup tone="navy" legend="Modelo" required>
            <ChoiceOption type="radio" value="existing" label="Modelo existente" {...register('modelMode')} />
            <ChoiceOption type="radio" value="new" label="Novo modelo" {...register('modelMode')} />
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
                {MATERIAL_CODES.map((code) => <ChoiceOption key={code} type="checkbox" value={code} label={MATERIAL_LABEL[code]} {...register('model.materials')} />)}
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
      {asking && <ConfirmDialog title="Descartar alterações?" message="Descartar o cadastro em andamento? O que foi digitado será perdido." confirmLabel="Descartar" cancelLabel="Continuar editando" onConfirm={confirmDiscard} onCancel={keepEditing} />}
    </>
  )
}
