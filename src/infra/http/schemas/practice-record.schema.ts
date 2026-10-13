import { z } from 'zod'
import type { PracticeRecord } from '../../../domain/habits/enterprise/entities/practice-record.js'
import { participantListQuerySchema } from './participant.schema.js'

// Largest value of a PostgreSQL `integer` column.
const MAX_QUANTITY = 2_147_483_647

export const goalIdParamsSchema = z.strictObject({
  id: z.uuid('Informe um UUID válido.'),
})
export const practiceRecordParamsSchema = z.strictObject({
  goalId: z.uuid('Informe um UUID válido.'),
  id: z.uuid('Informe um UUID válido.'),
})
// Same pagination rules as the participant listing (page from 1, limit 1 to 100).
export const practiceRecordListQuerySchema = participantListQuerySchema
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
export const practiceRecordListSchema = z.object({
  data: z.array(practiceRecordSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
})

export const dailyProgressQuerySchema = z.strictObject({
  date: z.iso.date('Informe uma data válida no formato AAAA-MM-DD.'),
})
export const dailyProgressSchema = z.object({
  goalId: z.uuid(),
  date: z.iso.date(),
  unit: z.enum(['ML', 'MINUTES', 'REPETITIONS']),
  dailyTarget: z.number().int(),
  totalCompleted: z.number().int(),
  completed: z.boolean(),
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
