import type { UseFormRegisterReturn } from 'react-hook-form'
import { ChoiceGroup, SelectField, TextAreaField, TextField } from '../../../shared/ui/fields'
import { CONDITION_LABEL, DAMAGE_LABEL } from '../model/labels'
import { today, type EditItemInput } from '../schemas/forms'
import { DAMAGE_TYPES, ITEM_CONDITIONS } from '../schemas/item'

export type SharedField = keyof EditItemInput
export type ItemFieldErrors = Partial<Record<SharedField, { message?: string }>>

interface Props {
  /** Adapter over the form's `register`, so the create and edit forms (different value types) can share these fields. */
  register: (name: SharedField) => UseFormRegisterReturn
  errors: ItemFieldErrors
  hasDamages: string | null | undefined
  /** Editing offers "Limpar" on the two fields the API can erase (BR-12). */
  onClear?: (field: 'serialNumber' | 'notes') => void
}

const message = (error: { message?: string } | undefined) => error?.message

/** Fields shared by the create and edit forms (BR-11). The navy tone matches the Figma modal. */
export function ItemFields({ register, errors, hasDamages, onClear }: Props) {
  const thisYear = new Date().getFullYear()
  return (
    <>
      <TextField tone="navy" label="Nome do item" required maxLength={120} error={message(errors.name)} {...register('name')} />
      <SelectField tone="navy" label="Condição" required error={message(errors.condition)} {...register('condition')}>
        <option value="">Selecione</option>
        {ITEM_CONDITIONS.map((value) => <option key={value} value={value}>{CONDITION_LABEL[value]}</option>)}
      </SelectField>
      <ChoiceGroup tone="navy" legend="Possui danos?" required error={message(errors.hasDamages)}>
        <label><input type="radio" value="yes" {...register('hasDamages')} /> Sim</label>
        <label><input type="radio" value="no" {...register('hasDamages')} /> Não</label>
      </ChoiceGroup>
      {hasDamages === 'yes' && (
        <ChoiceGroup tone="navy" legend="Tipos de dano" required error={message(errors.damages)}>
          {DAMAGE_TYPES.map((value) => <label key={value}><input type="checkbox" value={value} {...register('damages')} /> {DAMAGE_LABEL[value]}</label>)}
        </ChoiceGroup>
      )}
      <TextField tone="navy" label="Intensidade de uso (0 a 10)" required type="number" min={0} max={10} step={1} inputMode="numeric" error={message(errors.usageIntensity)} {...register('usageIntensity')} />
      <TextField tone="navy" label="Número de série" maxLength={120} error={message(errors.serialNumber)}
        hint={onClear && <>Apagar o texto e salvar remove o número de série. <button type="button" onClick={() => onClear('serialNumber')}>Limpar</button></>} {...register('serialNumber')} />
      <TextField tone="navy" label="Data de aquisição" type="date" max={today()} error={message(errors.acquiredAt)} {...register('acquiredAt')} />
      <TextField tone="navy" label="Ano de fabricação" type="number" min={1970} max={thisYear} step={1} inputMode="numeric" error={message(errors.manufacturingYear)} {...register('manufacturingYear')} />
      <TextAreaField tone="navy" label="Observações" maxLength={500} error={message(errors.notes)}
        hint={onClear && <>Apagar o texto e salvar remove as observações. <button type="button" onClick={() => onClear('notes')}>Limpar</button></>} {...register('notes')} />
    </>
  )
}
