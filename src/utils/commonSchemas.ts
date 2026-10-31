import { z } from 'zod'

/** `YYYY-MM-DD`, as returned by `format: date` fields. */
export const isoDate = z.iso.date()

/** ISO-8601 date-time with or without zone (the backends mix `…T14:12:00` and `…Z`). */
export const isoDateTime = z.iso.datetime({ offset: true, local: true })

/** The paged envelope of the inventory service: `{ content, page, size, totalElements, totalPages }`. */
export function pageSchema<Item extends z.ZodType>(item: Item) {
  return z
    .object({
      content: z.array(item),
      page: z.number().int().nonnegative(),
      size: z.number().int().positive(),
      totalElements: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    })
    .refine((page) => page.content.length <= page.totalElements, 'content is larger than totalElements')
    .refine((page) => (page.totalElements === 0 ? page.totalPages <= 1 : page.totalPages > 0), 'totalPages does not match totalElements')
}
