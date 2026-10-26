import styles from './Pagination.module.css'

interface Props {
  /** Zero-based, as the API counts. */
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPage: (page: number) => void
  onSize: (size: number) => void
  sizes?: number[]
}

export function Pagination({ page, totalPages, totalElements, size, onPage, onSize, sizes = [20, 50, 100] }: Props) {
  const last = Math.max(0, totalPages - 1)
  return (
    <nav className={styles.nav} aria-label="Paginação">
      <p aria-live="polite">{totalElements} {totalElements === 1 ? 'resultado' : 'resultados'} · página {Math.min(page, last) + 1} de {Math.max(1, totalPages)}</p>
      <div className={styles.controls}>
        {sizes.length > 1 && (
          <label>Por página
            <select value={size} onChange={(event) => onSize(Number(event.target.value))}>
              {sizes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 0}>Anterior</button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= last}>Próxima</button>
      </div>
    </nav>
  )
}
