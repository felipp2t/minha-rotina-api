import { type Either, left, right } from '../../../../core/types/either.js'
import type { HabitGoalUnit } from '../../enterprise/entities/habit-goal.js'
import { todayInSaoPaulo } from '../../enterprise/services/today-in-sao-paulo.js'
import type { HabitGoalRepository } from '../repositories/habit-goal-repository.js'
import type { PracticeRecordRepository } from '../repositories/practice-record-repository.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { InvalidProgressDateError } from './errors/invalid-progress-date-error.js'

export interface GetDailyProgressInput {
  goalId: string
  date: string
}

export interface DailyProgress {
  goalId: string
  date: string
  unit: HabitGoalUnit
  dailyTarget: number
  totalCompleted: number
  completed: boolean
}

export class GetDailyProgressUseCase {
  constructor(
    private readonly habitGoalRepository: HabitGoalRepository,
    private readonly practiceRecordRepository: PracticeRecordRepository,
  ) {}

  async execute(
    input: GetDailyProgressInput,
  ): Promise<
    Either<HabitGoalNotFoundError | InvalidProgressDateError, DailyProgress>
  > {
    const goal = await this.habitGoalRepository.findById(input.goalId)
    if (!goal) {
      return left(new HabitGoalNotFoundError())
    }

    const today = todayInSaoPaulo()
    if (goal.startDate > today) {
      return left(
        new InvalidProgressDateError(
          `A meta ainda não começou; o progresso pode ser consultado a partir de ${goal.startDate}.`,
        ),
      )
    }
    if (input.date > today) {
      return left(
        new InvalidProgressDateError(
          'A data consultada não pode ser posterior a hoje.',
        ),
      )
    }
    if (input.date < goal.startDate) {
      return left(
        new InvalidProgressDateError(
          'A data consultada não pode ser anterior ao início da meta.',
        ),
      )
    }

    // REGRA: R4 soma os registros da meta na data consultada.
    const totalCompleted =
      await this.practiceRecordRepository.sumQuantityByGoalIdAndDate(
        input.goalId,
        input.date,
      )

    return right({
      goalId: goal.id.toString(),
      date: input.date,
      unit: goal.unit,
      dailyTarget: goal.dailyTarget,
      totalCompleted,
      // REGRA: R4 o dia é cumprido quando a soma alcança ou supera o alvo.
      completed: totalCompleted >= goal.dailyTarget,
    })
  }
}
