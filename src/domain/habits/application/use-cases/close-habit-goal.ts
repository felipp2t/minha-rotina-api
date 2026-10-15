import { type Either, left, right } from '../../../../core/types/either.js'
import type { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import type { HabitGoalRepository } from '../repositories/habit-goal-repository.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'

export class CloseHabitGoalUseCase {
  constructor(private readonly habitGoalRepository: HabitGoalRepository) {}

  async execute(
    id: string,
  ): Promise<Either<HabitGoalNotFoundError, HabitGoal>> {
    // REGRA: R3 — encerrar preserva a configuração e o histórico da meta.
    const habitGoal = await this.habitGoalRepository.close(id)

    if (!habitGoal) {
      return left(new HabitGoalNotFoundError())
    }

    return right(habitGoal)
  }
}
