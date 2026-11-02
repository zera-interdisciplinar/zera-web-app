import styles from '../../../styles/components/Models/Models.module.css'
import { useModelForm } from '../../hooks/useModelForm'
import type { ModelDialogProps } from '../../types/componentes/ModelDialog'
import { describeApiError } from '../../utils/apiError'
import { MATERIAL_LABEL } from '../../utils/itemLabels'
import { MATERIAL_CODES } from '../../utils/itemSchemas'
import { Button } from '../Button'
import { ChoiceGroup } from '../ChoiceGroup'
import { ChoiceOption } from '../ChoiceOption'
import { ConfirmDialog } from '../ConfirmDialog'
import { Dialog } from '../Dialog'
import { SelectField } from '../SelectField'
import { TextAreaField } from '../TextAreaField'
import { TextField } from '../TextField'


export function ModelDialog({ model, onClose, onDone }: ModelDialogProps) {
  const { register, errors, categories, pending, failure, asking, requestClose, confirmDiscard, keepEditing, submit } = useModelForm({ model, onClose, onDone })

  return (
    <>
      <Dialog open title={model ? 'Editar modelo' : 'Novo modelo'} description={model ? 'Atualize a identificação, composição ou detalhes do modelo.' : 'Preencha a identificação, composição e detalhes do modelo.'} width={48} onClose={requestClose}>
        <form className={`${styles.form} ${styles.modelForm}`} onSubmit={submit} noValidate>
          {failure && <p role="alert" className={styles.formAlert}>{describeApiError(failure)}</p>}
          <p className={styles.formIntro}>Defina um modelo para padronizar os equipamentos da unidade. Campos com * são obrigatórios.</p>
          <fieldset className={styles.formSection}><legend>Identificação</legend>
          <TextField label="Nome do modelo" required maxLength={120} error={errors.name?.message} {...register('name')} />
          <TextField label="Fabricante" required maxLength={120} error={errors.manufacturer?.message} {...register('manufacturer')} />
          {model ? (
            <p className={styles.readonly}>Categoria: <strong>{model.category.name}</strong> · não pode ser alterada depois do cadastro.</p>
          ) : (
            <SelectField label="Categoria" required error={errors.categoryId?.message} hint={categories.isError ? 'Não foi possível carregar as categorias.' : undefined} {...register('categoryId')}>
              <option value="">{categories.isPending ? 'Carregando…' : 'Selecione'}</option>
              {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </SelectField>
          )}
          </fieldset>
          <fieldset className={styles.formSection}><legend>Composição</legend>
          <ChoiceGroup legend="Materiais" required error={errors.materials?.message}>
            {MATERIAL_CODES.map((code) => <ChoiceOption key={code} type="checkbox" value={code} label={MATERIAL_LABEL[code]} {...register('materials')} />)}
          </ChoiceGroup>
          {!model && <TextField label="Peso estimado (kg)" type="number" min={0} step="any" inputMode="decimal" error={errors.estimatedWeightKg?.message} {...register('estimatedWeightKg')} />}
          </fieldset>
          <fieldset className={styles.formSection}><legend>Detalhes opcionais</legend>
          <TextField label="Garantia (meses)" type="number" min={1} step={1} inputMode="numeric" error={errors.warrantyMonths?.message}
            hint={model ? 'Um valor já informado só pode ser trocado, não apagado.' : undefined} {...register('warrantyMonths')} />
          <TextField label="Vida útil esperada (meses)" type="number" min={1} step={1} inputMode="numeric" error={errors.expectedLifespanMonths?.message}
            hint={model ? 'Um valor já informado só pode ser trocado, não apagado.' : undefined} {...register('expectedLifespanMonths')} />
          {!model && <TextAreaField label="Observações" maxLength={500} error={errors.notes?.message} {...register('notes')} />}
          </fieldset>
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
