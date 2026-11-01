import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { StockManagementContent } from '../StockManagementContent'
import styles from '../../../styles/pages/SettingsPage/SettingsPage.module.css'

export function StockManagement() {
  const [open, setOpen] = useState(false)
  return (
    <details className={`${styles.card} ${styles.setting}`} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className={styles.stockSummary}>Gestão do estoque<span>Capacidade e ocupação da unidade</span><ChevronDown size={18} aria-hidden="true" /></summary>
      {open && <StockManagementContent />}
    </details>
  )
}
