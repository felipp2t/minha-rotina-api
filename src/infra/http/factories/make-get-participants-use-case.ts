import { GetParticipantsUseCase } from '../../../domain/habits/application/use-cases/get-participants.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleParticipantRepository } from '../../db/drizzle/repositories/participant-repository.js'

export function makeGetParticipantsUseCase() {
  return new GetParticipantsUseCase(
    new DrizzleParticipantRepository(getDatabase()),
  )
}
