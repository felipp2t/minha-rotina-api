import { z } from 'zod'

export const errorSchema = z.object({
  message: z.string(),
  metadata: z.object({
    fields: z.array(z.object({ field: z.string(), message: z.string() })),
  }),
})

// Builds the public error DTO without exposing internal error details.
export function toErrorResponse(
  message: string,
  fields: { field: string; message: string }[] = [],
) {
  return { message, metadata: { fields } }
}
