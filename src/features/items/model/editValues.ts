import type { EditItemInput, EditItemValues } from '../schemas/forms'
import type { ItemResponse } from '../schemas/item'

/** What the edit form starts with: strings, because that is what the inputs hold. */
export function toEditInput(item: ItemResponse): EditItemInput {
  const hasDamages = item.hasDamages ?? (item.damages?.length ?? 0) > 0
  return {
    name: item.name ?? '',
    condition: (item.condition ?? '') as EditItemInput['condition'],
    // '' (not undefined) keeps the radios uncontrolled-but-clean, so an untouched form is not "dirty".
    hasDamages: (item.hasDamages == null && !item.damages?.length ? '' : hasDamages ? 'yes' : 'no') as EditItemInput['hasDamages'],
    damages: item.damages ?? [],
    usageIntensity: item.usageIntensity ?? '',
    serialNumber: item.serialNumber ?? '',
    acquiredAt: item.acquiredAt ?? '',
    manufacturingYear: item.manufacturingYear ?? '',
    notes: item.notes ?? '',
  }
}

/** The same data in the shape the validated form produces, to diff against (BR-12). Missing data stays undefined. */
export function toEditValues(item: ItemResponse): Partial<EditItemValues> {
  const input = toEditInput(item)
  return {
    name: item.name ?? undefined,
    condition: item.condition ?? undefined,
    hasDamages: input.hasDamages || undefined,
    damages: item.damages ?? [],
    usageIntensity: item.usageIntensity ?? undefined,
    serialNumber: item.serialNumber || undefined,
    acquiredAt: item.acquiredAt || undefined,
    manufacturingYear: item.manufacturingYear ?? undefined,
    notes: item.notes || undefined,
  }
}
