import { type Either, left, right } from '../../../../core/types/either.js'
import { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import { todayInSaoPaulo } from '../../enterprise/services/today-in-sao-paulo.js'
import type { HabitGoalRepository } from '../repositories/habit-goal-repository.js'
import type { PracticeRecordRepository } from '../repositories/practice-record-repository.js'
import { HabitGoalClosedError } from './errors/habit-goal-closed-error.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { InvalidPracticeDateError } from './errors/invalid-practice-date-error.js'

export interface CreatePracticeRecordInput {
  goalId: string
  date: string
  quantity: number
}

type CreatePracticeRecordError =
  | HabitGoalNotFoundError
  | HabitGoalClosedError
  | InvalidPracticeDateError

// Registers a practice applying R3 (closed goal) and R2 (start date to today).
// Several records on the same date and totals above the daily target are allowed.
export class CreatePracticeRecordUseCase {
  constructor(
    private readonly habitGoalRepository: HabitGoalRepository,
    private readonly practiceRecordRepository: PracticeRecordRepository,
  ) {}

  async execute(
    input: CreatePracticeRecordInput,
  ): Promise<Either<CreatePracticeRecordError, PracticeRecord>> {
    const goal = await this.habitGoalRepository.findById(input.goalId)
    if (!goal) {
      return left(new HabitGoalNotFoundError())
    }

    if (goal.isClosed) {
      return left(new HabitGoalClosedError())
    }

    // Dates in YYYY-MM-DD format can be compared as text.
    const today = todayInSaoPaulo()
    if (goal.startDate > today) {
      return left(
        new InvalidPracticeDateError(
          `A meta ainda não começou; registros são aceitos a partir de ${goal.startDate}.`,
        ),
      )
    }
    if (input.date > today) {
      return left(
        new InvalidPracticeDateError(
          'A data da prática não pode ser posterior a hoje.',
        ),
      )
    }
    if (input.date < goal.startDate) {
      return left(
        new InvalidPracticeDateError(
          'A data da prática não pode ser anterior ao início da meta.',
        ),
      )
    }

    const record = PracticeRecord.create({
      goalId: goal.id,
      date: input.date,
      quantity: input.quantity,
    })

    // The goal may have been closed after the lookup above (R3 race).
    if (!(await this.practiceRecordRepository.create(record))) {
      return left(new HabitGoalClosedError())
    }

    return right(record)
  }
}
