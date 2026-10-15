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
      // REGRA: R3 metas encerradas não aceitam novos registros, nem retroativos.
      return left(new HabitGoalClosedError())
    }

    const today = todayInSaoPaulo()

    if (goal.startDate > today) {
      // REGRA: R2 registros só podem ser feitos entre o início da meta e hoje.
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

    const created = await this.practiceRecordRepository.create(record)

    if (!created) {
      return left(new HabitGoalClosedError())
    }

    return right(record)
  }
}
