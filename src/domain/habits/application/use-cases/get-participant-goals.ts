import { type Either, left, right } from '../../../../core/types/either.js'
import type {
  HabitGoalPage,
  HabitGoalRepository,
} from '../repositories/habit-goal-repository.js'
import type {
  PaginationInput,
  ParticipantRepository,
} from '../repositories/participant-repository.js'
import { ParticipantNotFoundError } from './errors/participant-not-found-error.js'

interface ParticipantGoalsResult extends HabitGoalPage {
  pagination: PaginationInput & { total: number; totalPages: number }
}

export class GetParticipantGoalsUseCase {
  constructor(
    private readonly habitGoalRepository: HabitGoalRepository,
    private readonly participantRepository: ParticipantRepository,
  ) {}

  async execute(
    participantId: string,
    { page, limit }: PaginationInput,
  ): Promise<Either<ParticipantNotFoundError, ParticipantGoalsResult>> {
    const participant = await this.participantRepository.findById(participantId)
    if (!participant) return left(new ParticipantNotFoundError())
    const { goals, total } = await this.habitGoalRepository.findByParticipantId(
      participantId,
      { page, limit },
    )
    return right({
      goals,
      total,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }
}
