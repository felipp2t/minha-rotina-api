import { GetParticipantUseCase } from '../../../domain/habits/application/use-cases/get-participant.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleParticipantRepository } from '../../db/drizzle/repositories/participant-repository.js'

// Connects participant lookup to the PostgreSQL repository.
export function makeGetParticipantUseCase() {
  return new GetParticipantUseCase(
    new DrizzleParticipantRepository(getDatabase()),
  )
}
