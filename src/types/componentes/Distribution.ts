import type { DistributionRow } from '../dashboard'

export interface DistributionProps {
  title: string
  rows: DistributionRow[]
  emptyText: string
}
