export interface PaginationProps {
  /** Zero-based, as the API counts. */
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPage: (page: number) => void
  onSize: (size: number) => void
  sizes?: number[]
}
