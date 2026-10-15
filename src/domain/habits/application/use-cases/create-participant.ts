import { type Either, left, right } from '../../../../core/types/either.js'
import { Participant } from '../../enterprise/entities/participant.js'
import type { ParticipantRepository } from '../repositories/participant-repository.js'
import { ParticipantAlreadyExistsError } from './errors/participant-already-exists-error.js'

export interface CreateParticipantInput {
  name: string
  email: string
}

export class CreateParticipantUseCase {
  constructor(private readonly participantRepository: ParticipantRepository) {}

  async execute(
    input: CreateParticipantInput,
  ): Promise<Either<ParticipantAlreadyExistsError, Participant>> {
    const email = input.email.trim().toLowerCase()

    const existingParticipant =
      await this.participantRepository.findByEmail(email)

    if (existingParticipant) {
      return left(new ParticipantAlreadyExistsError())
    }

    const participant = Participant.create({ name: input.name.trim(), email })

    const created = await this.participantRepository.create(participant)

    if (!created) {
      return left(new ParticipantAlreadyExistsError())
    }

    return right(participant)
  }
}
