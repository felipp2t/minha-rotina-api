import type {
  PaginationInput,
  ParticipantRepository,
} from '../repositories/participant-repository.js'

// Lists participants and calculates pagination metadata from the full total.
export class GetParticipantsUseCase {
  constructor(private readonly participantRepository: ParticipantRepository) {}

  async execute({ page, limit }: PaginationInput) {
    const { participants, total } = await this.participantRepository.findAll({
      page,
      limit,
    })
    return {
      participants,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
