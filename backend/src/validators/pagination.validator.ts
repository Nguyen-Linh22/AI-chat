import { z } from 'zod'

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({
      message: 'Page phải là số nguyên lớn hơn hoặc bằng 1'
    })
    .int('Page phải là số nguyên')
    .min(1, 'Page phải là số nguyên lớn hơn hoặc bằng 1')
    .default(1),

  limit: z.coerce
    .number({
      message: 'Limit phải là số nguyên từ 1 đến 100'
    })
    .int('Limit phải là số nguyên')
    .min(1, 'Limit phải là số nguyên từ 1 đến 100')
    .max(100, 'Limit phải là số nguyên từ 1 đến 100')
    .default(20)
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
