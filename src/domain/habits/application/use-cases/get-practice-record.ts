import { type Either, left, right } from '../../../../core/types/either.js'
import type { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import type { HabitGoalRepository } from '../repositories/habit-goal-repository.js'
import type { PracticeRecordRepository } from '../repositories/practice-record-repository.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { PracticeRecordNotFoundError } from './errors/practice-record-not-found-error.js'

export interface GetPracticeRecordInput {
  goalId: string
  id: string
}

export class GetPracticeRecordUseCase {
  constructor(
    private readonly habitGoalRepository: HabitGoalRepository,
    private readonly practiceRecordRepository: PracticeRecordRepository,
  ) {}

  async execute({
    goalId,
    id,
  }: GetPracticeRecordInput): Promise<
    Either<HabitGoalNotFoundError | PracticeRecordNotFoundError, PracticeRecord>
  > {
    const goal = await this.habitGoalRepository.findById(goalId)

    if (!goal) {
      return left(new HabitGoalNotFoundError())
    }

    const record = await this.practiceRecordRepository.findById(id)

    if (!record || record.goalId.toString() !== goalId) {
      return left(new PracticeRecordNotFoundError())
    }

    return right(record)
  }
}
