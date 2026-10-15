import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { Participant } from '../../../../domain/habits/enterprise/entities/participant.js'
import type { participants } from '../schema/participants.js'

export class DrizzleParticipantMapper {
  static toDomain(row: InferSelectModel<typeof participants>): Participant {
    return Participant.create(
      { name: row.name, email: row.email },
      new UniqueEntityID(row.id),
    )
  }

  static toDrizzle(
    participant: Participant,
  ): InferInsertModel<typeof participants> {
    return {
      id: participant.id.toString(),
      name: participant.name,
      email: participant.email,
    }
  }
}
