import styles from '../../../styles/components/Pagination/Pagination.module.css'
import type { PaginationProps } from '../../types/componentes/Pagination'
import { FilterSelect } from '../FilterSelect'

export function Pagination({ page, totalPages, totalElements, size, onPage, onSize, sizes = [20, 50, 100] }: PaginationProps) {
  const last = Math.max(0, totalPages - 1)
  return (
    <nav className={styles.nav} aria-label="Paginação">
      <p aria-live="polite">{totalElements} {totalElements === 1 ? 'resultado' : 'resultados'} · página {Math.min(page, last) + 1} de {Math.max(1, totalPages)}</p>
      <div className={styles.controls}>
        {sizes.length > 1 && (
          <FilterSelect label="Por página" value={size} onChange={(event) => onSize(Number(event.target.value))}>
            {sizes.map((value) => <option key={value} value={value}>{value}</option>)}
          </FilterSelect>
        )}
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 0}>Anterior</button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= last}>Próxima</button>
      </div>
    </nav>
  )
}
