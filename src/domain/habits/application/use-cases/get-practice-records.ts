import { type Either, left, right } from '../../../../core/types/either.js'
import type { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import type { HabitGoalRepository } from '../repositories/habit-goal-repository.js'
import type { PaginationInput } from '../repositories/participant-repository.js'
import type { PracticeRecordRepository } from '../repositories/practice-record-repository.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'

export interface GetPracticeRecordsInput extends PaginationInput {
  goalId: string
}

export interface GetPracticeRecordsOutput {
  records: PracticeRecord[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// Lists a goal's history, including closed goals, with complete pagination totals.
export class GetPracticeRecordsUseCase {
  constructor(
    private readonly habitGoalRepository: HabitGoalRepository,
    private readonly practiceRecordRepository: PracticeRecordRepository,
  ) {}

  async execute({
    goalId,
    page,
    limit,
  }: GetPracticeRecordsInput): Promise<
    Either<HabitGoalNotFoundError, GetPracticeRecordsOutput>
  > {
    const goal = await this.habitGoalRepository.findById(goalId)

    if (!goal) {
      return left(new HabitGoalNotFoundError())
    }

    const { records, total } =
      await this.practiceRecordRepository.findManyByGoalId(goalId, {
        page,
        limit,
      })

    return right({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }
}
