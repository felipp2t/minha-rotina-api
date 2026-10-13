import { z } from 'zod'
import type { HabitGoal } from '../../../domain/habits/enterprise/entities/habit-goal.js'
import { participantListQuerySchema } from './participant.schema.js'

export const habitGoalUnitSchema = z.enum(['ML', 'MINUTES', 'REPETITIONS'])
export const createHabitGoalBodySchema = z.strictObject({
  participantId: z.uuid('Informe um UUID válido.'),
  name: z
    .string()
    .trim()
    .min(1, 'Informe um nome.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  // Matches the existing PostgreSQL integer column without allowing overflow.
  dailyTarget: z.number().int().positive().max(2_147_483_647),
  unit: habitGoalUnitSchema,
  startDate: z.iso
    .date('Informe uma data válida no formato AAAA-MM-DD.')
    .refine((date) => date >= '0001-01-01', 'Informe uma data válida.'),
})
export const habitGoalSchema = z.object({
  id: z.uuid(),
  participantId: z.uuid(),
  name: z.string(),
  dailyTarget: z.number().int().positive(),
  unit: habitGoalUnitSchema,
  startDate: z.iso.date(),
  closedAt: z.string().nullable(),
})
export type CreateHabitGoalDto = z.infer<typeof createHabitGoalBodySchema>
export type HabitGoalDto = z.infer<typeof habitGoalSchema>

export function toHabitGoalDto(goal: HabitGoal): HabitGoalDto {
  return {
    id: goal.id.toString(),
    participantId: goal.participantId.toString(),
    name: goal.name,
    dailyTarget: goal.dailyTarget,
    unit: goal.unit,
    startDate: goal.startDate,
    closedAt: goal.closedAt?.toISOString() ?? null,
  }
}

export const habitGoalIdParamsSchema = z.strictObject({
  id: z.uuid('Informe um UUID válido.'),
})
export const habitGoalListQuerySchema = participantListQuerySchema
export const habitGoalListSchema = z.object({
  data: z.array(habitGoalSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
})
