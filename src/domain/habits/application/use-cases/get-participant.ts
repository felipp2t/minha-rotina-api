import { type Either, left, right } from '../../../../core/types/either.js'
import type { Participant } from '../../enterprise/entities/participant.js'
import type { ParticipantRepository } from '../repositories/participant-repository.js'
import { ParticipantNotFoundError } from './errors/participant-not-found-error.js'

// Finds a participant or returns the domain's not-found error.
export class GetParticipantUseCase {
  constructor(private readonly participantRepository: ParticipantRepository) {}

  async execute(
    id: string,
  ): Promise<Either<ParticipantNotFoundError, Participant>> {
    const participant = await this.participantRepository.findById(id)

    if (!participant) {
      return left(new ParticipantNotFoundError())
    }

    return right(participant)
  }
}
