import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { type Either, left, right } from '../../../../core/types/either.js'
import {
  HabitGoal,
  type HabitGoalUnit,
} from '../../enterprise/entities/habit-goal.js'
import type { HabitGoalRepository } from '../repositories/habit-goal-repository.js'
import type { ParticipantRepository } from '../repositories/participant-repository.js'
import { HabitGoalAlreadyExistsError } from './errors/habit-goal-already-exists-error.js'
import { ParticipantNotFoundError } from './errors/participant-not-found-error.js'

export interface CreateHabitGoalInput {
  participantId: string
  name: string
  dailyTarget: number
  unit: HabitGoalUnit
  startDate: string
}

// Enforces participant existence and R5; persistence also protects concurrent writes.
export class CreateHabitGoalUseCase {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly habitGoalRepository: HabitGoalRepository,
  ) {}

  async execute(
    input: CreateHabitGoalInput,
  ): Promise<
    Either<ParticipantNotFoundError | HabitGoalAlreadyExistsError, HabitGoal>
  > {
    if (!(await this.participantRepository.findById(input.participantId))) {
      return left(new ParticipantNotFoundError())
    }
    const goal = HabitGoal.create({
      ...input,
      participantId: new UniqueEntityID(input.participantId),
    })
    if (
      await this.habitGoalRepository.findActiveByParticipantNameAndUnit(
        input.participantId,
        goal.normalizedName,
        goal.unit,
      )
    ) {
      return left(new HabitGoalAlreadyExistsError())
    }
    if (!(await this.habitGoalRepository.create(goal))) {
      return left(new HabitGoalAlreadyExistsError())
    }
    return right(goal)
  }
}
