import { GetParticipantsUseCase } from '../../../domain/habits/application/use-cases/get-participants.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleParticipantRepository } from '../../db/drizzle/repositories/participant-repository.js'

// Connects paginated participant listing to the PostgreSQL repository.
export function makeGetParticipantsUseCase() {
  return new GetParticipantsUseCase(
    new DrizzleParticipantRepository(getDatabase()),
  )
}
