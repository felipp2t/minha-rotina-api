import { z } from 'zod'
import type { PracticeRecord } from '../../../domain/habits/enterprise/entities/practice-record.js'

// Largest value of a PostgreSQL `integer` column.
const MAX_QUANTITY = 2_147_483_647

export const goalIdParamsSchema = z.strictObject({
  id: z.uuid('Informe um UUID válido.'),
})
export const createPracticeRecordBodySchema = z.strictObject({
  date: z.iso.date('Informe uma data válida no formato AAAA-MM-DD.'),
  quantity: z
    .number('Informe um inteiro positivo.')
    .int('Informe um inteiro positivo.')
    .positive('Informe um inteiro positivo.')
    .max(MAX_QUANTITY, `Informe um inteiro de até ${MAX_QUANTITY}.`),
})
export const practiceRecordSchema = z.object({
  id: z.uuid(),
  goalId: z.uuid(),
  date: z.iso.date(),
  quantity: z.number().int(),
})

export type CreatePracticeRecordDto = z.infer<
  typeof createPracticeRecordBodySchema
>
export type PracticeRecordDto = z.infer<typeof practiceRecordSchema>

// Explicitly maps the internal practice record to the public response DTO.
export function toPracticeRecordDto(record: PracticeRecord): PracticeRecordDto {
  return {
    id: record.id.toString(),
    goalId: record.goalId.toString(),
    date: record.date,
    quantity: record.quantity,
  }
}
