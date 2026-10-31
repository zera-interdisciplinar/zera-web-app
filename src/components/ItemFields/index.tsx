import { ChoiceGroup } from '../ChoiceGroup'
import { SelectField } from '../SelectField'
import { TextAreaField } from '../TextAreaField'
import { TextField } from '../TextField'
import { CONDITION_LABEL, DAMAGE_LABEL } from '../../utils/itemLabels'
import { today } from '../../utils/itemValidation'
import { DAMAGE_TYPES, ITEM_CONDITIONS } from '../../utils/itemSchemas'
import type { ItemFieldsProps } from '../../types/componentes/ItemFields'
import { ChoiceOption } from '../ChoiceOption'

const message = (error: { message?: string } | undefined) => error?.message

/** Fields shared by the create and edit forms (BR-11). The navy tone matches the Figma modal. */
export function ItemFields({ register, errors, hasDamages, onClear }: ItemFieldsProps) {
  const thisYear = new Date().getFullYear()
  return (
    <>
      <TextField tone="navy" label="Nome do item" required maxLength={120} error={message(errors.name)} {...register('name')} />
      <SelectField tone="navy" label="Condição" required error={message(errors.condition)} {...register('condition')}>
        <option value="">Selecione</option>
        {ITEM_CONDITIONS.map((value) => <option key={value} value={value}>{CONDITION_LABEL[value]}</option>)}
      </SelectField>
      <ChoiceGroup tone="navy" legend="Possui danos?" required error={message(errors.hasDamages)}>
        <ChoiceOption type="radio" value="yes" label="Sim" {...register('hasDamages')} />
        <ChoiceOption type="radio" value="no" label="Não" {...register('hasDamages')} />
      </ChoiceGroup>
      {hasDamages === 'yes' && (
        <ChoiceGroup tone="navy" legend="Tipos de dano" required error={message(errors.damages)}>
          {DAMAGE_TYPES.map((value) => <ChoiceOption key={value} type="checkbox" value={value} label={DAMAGE_LABEL[value]} {...register('damages')} />)}
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
