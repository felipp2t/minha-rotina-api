import { type Either, left, right } from '../../../../core/types/either.js'
import type { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import type { HabitGoalRepository } from '../repositories/habit-goal-repository.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'

// Finds a habitGoal or returns the domain's not-found error.
export class GetHabitGoalUseCase {
  constructor(private readonly habitGoalRepository: HabitGoalRepository) {}

  async execute(
    id: string,
  ): Promise<Either<HabitGoalNotFoundError, HabitGoal>> {
    const habitGoal = await this.habitGoalRepository.findById(id)

    if (!habitGoal) {
      return left(new HabitGoalNotFoundError())
    }

    return right(habitGoal)
  }
}
