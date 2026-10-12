import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { Participant } from '../../../../domain/habits/enterprise/entities/participant.js'
import type { participants } from '../schema/participants.js'

// Converts participant rows to domain records and back to insert values.
export class DrizzleParticipantMapper {
  static toDomain(row: InferSelectModel<typeof participants>): Participant {
    return { id: row.id, name: row.name, email: row.email }
  }
  static toDrizzle(
    participant: Participant,
  ): InferInsertModel<typeof participants> {
    return {
      id: participant.id,
      name: participant.name,
      email: participant.email,
    }
  }
}
