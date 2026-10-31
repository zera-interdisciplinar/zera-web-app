import { formatDate, formatDateTime } from '../../utils/format'
import { CONDITION_LABEL, DAMAGE_LABEL, MATERIAL_LABEL } from '../../utils/itemLabels'
import styles from '../../../styles/components/Items/Items.module.css'
import type { FactsProps } from '../../types/componentes/Facts'
import { Fact } from '../Fact'

export function Facts({ item }: FactsProps) {
  const model = item.model
  const damages = item.hasDamages ? (item.damages ?? []).map((damage) => DAMAGE_LABEL[damage]).join(', ') || 'Sim' : item.hasDamages === false ? 'Não' : null
  return (
    <dl className={styles.facts}>
      <Fact label="Código de barras">{item.barcode}</Fact>
      <Fact label="Modelo">{model ? `${model.name} — ${model.manufacturer}` : null}</Fact>
      <Fact label="Categoria">{model?.category.name}</Fact>
      <Fact label="Materiais">{model?.materials.length ? model.materials.map((material) => MATERIAL_LABEL[material.code]).join(', ') : null}</Fact>
      <Fact label="Condição">{item.condition ? CONDITION_LABEL[item.condition] : null}</Fact>
      <Fact label="Danos">{damages}</Fact>
      <Fact label="Intensidade de uso">{item.usageIntensity == null ? null : `${item.usageIntensity} de 10`}</Fact>
      <Fact label="Número de série">{item.serialNumber}</Fact>
      <Fact label="Data de aquisição">{item.acquiredAt ? formatDate(item.acquiredAt) : null}</Fact>
      <Fact label="Ano de fabricação">{item.manufacturingYear}</Fact>
      <Fact label="Previsão de falha">{item.predictedFailureDate ? formatDate(item.predictedFailureDate) : 'Sem previsão'}</Fact>
      <Fact label="Cadastrado por">{item.createdByName}</Fact>
      <Fact label="Cadastrado em">{formatDateTime(item.createdAt)}</Fact>
      <Fact label="Última atualização">{formatDateTime(item.updatedAt)}</Fact>
      <Fact label="Observações">{item.notes}</Fact>
    </dl>
  )
}
