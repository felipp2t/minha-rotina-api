import { z } from 'zod'
import type { Participant } from '../../../domain/habits/enterprise/entities/participant.js'

export const createParticipantBodySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Informe um nome.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
})
export const participantSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
})
export const participantIdParamsSchema = z.strictObject({
  id: z.uuid('Informe um UUID válido.'),
})
export const emptyQuerySchema = z.strictObject({})
export const participantListQuerySchema = z
  .strictObject({
    page: z.coerce
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(({ page, limit }) => Number.isSafeInteger((page - 1) * limit), {
    message: 'A página solicitada excede o limite suportado.',
    path: ['page'],
  })
export const participantListSchema = z.object({
  data: z.array(participantSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
})

export type CreateParticipantDto = z.infer<typeof createParticipantBodySchema>
export type ParticipantDto = z.infer<typeof participantSchema>

// Explicitly maps the internal participant to the public response DTO.
export function toParticipantDto(participant: Participant): ParticipantDto {
  return {
    id: participant.id.toString(),
    name: participant.name,
    email: participant.email,
  }
}
