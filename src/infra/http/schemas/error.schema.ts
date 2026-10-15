import { z } from 'zod'

export const errorSchema = z.object({
  message: z.string(),
  metadata: z.object({
    fields: z.array(z.object({ field: z.string(), message: z.string() })),
  }),
})

export function toErrorResponse(
  message: string,
  fields: { field: string; message: string }[] = [],
) {
  return { message, metadata: { fields } }
}
