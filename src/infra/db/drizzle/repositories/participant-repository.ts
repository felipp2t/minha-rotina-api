import { asc, count, eq } from 'drizzle-orm'
import type {
  PaginationInput,
  ParticipantRepository,
} from '../../../../domain/habits/application/repositories/participant-repository.js'
import type { Participant } from '../../../../domain/habits/enterprise/entities/participant.js'
import type { Database } from '../../database.js'
import { DrizzleParticipantMapper } from '../mappers/drizzle-participant-mapper.js'
import { participants } from '../schema/participants.js'

export class DrizzleParticipantRepository implements ParticipantRepository {
  constructor(private readonly database: Database) {}

  async create(participant: Participant): Promise<boolean> {
    const rows = await this.database.db
      .insert(participants)
      .values(DrizzleParticipantMapper.toDrizzle(participant))
      .onConflictDoNothing({ target: participants.email })
      .returning({ id: participants.id })
    return rows.length === 1
  }

  async findByEmail(email: string): Promise<Participant | null> {
    const [row] = await this.database.db
      .select()
      .from(participants)
      .where(eq(participants.email, email))
      .limit(1)
    return row ? DrizzleParticipantMapper.toDomain(row) : null
  }

  async findById(id: string): Promise<Participant | null> {
    const [row] = await this.database.db
      .select()
      .from(participants)
      .where(eq(participants.id, id))
      .limit(1)
    return row ? DrizzleParticipantMapper.toDomain(row) : null
  }

  findAll({ page, limit }: PaginationInput) {
    return this.database.db.transaction(
      async (transaction) => {
        const [result] = await transaction
          .select({ total: count() })
          .from(participants)
        const rows = await transaction
          .select()
          .from(participants)
          .orderBy(asc(participants.name), asc(participants.id))
          .limit(limit)
          .offset((page - 1) * limit)
        return {
          participants: rows.map(DrizzleParticipantMapper.toDomain),
          total: result?.total ?? 0,
        }
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
  }
}
