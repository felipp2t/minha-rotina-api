import { CreateParticipantUseCase } from '../../../domain/habits/application/use-cases/create-participant.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleParticipantRepository } from '../../db/drizzle/repositories/participant-repository.js'

export function makeCreateParticipantUseCase() {
  return new CreateParticipantUseCase(
    new DrizzleParticipantRepository(getDatabase()),
  )
}
