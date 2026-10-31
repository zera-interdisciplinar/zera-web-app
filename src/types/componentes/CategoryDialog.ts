import type { z } from 'zod'
import type { categorySchema } from '../../utils/itemSchemas'

export interface CategoryDialogProps {
  category?: z.infer<typeof categorySchema>
  onClose: () => void
  onDone: (message: string) => void
}
