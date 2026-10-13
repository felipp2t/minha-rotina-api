import { type Either, left, right } from '../../../../core/types/either.js'
import { Participant } from '../../enterprise/entities/participant.js'
import type { ParticipantRepository } from '../repositories/participant-repository.js'
import { ParticipantAlreadyExistsError } from './errors/participant-already-exists-error.js'

export interface CreateParticipantInput {
  name: string
  email: string
}

// Normalizes participant data and enforces email uniqueness, including races.
export class CreateParticipantUseCase {
  constructor(private readonly participantRepository: ParticipantRepository) {}

  async execute(
    input: CreateParticipantInput,
  ): Promise<Either<ParticipantAlreadyExistsError, Participant>> {
    const email = input.email.trim().toLowerCase()

    if (await this.participantRepository.findByEmail(email)) {
      return left(new ParticipantAlreadyExistsError())
    }

    const participant = Participant.create({ name: input.name.trim(), email })

    if (!(await this.participantRepository.create(participant))) {
      return left(new ParticipantAlreadyExistsError())
    }

    return right(participant)
  }
}
