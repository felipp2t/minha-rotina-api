import { GetHabitGoalUseCase } from '../../../domain/habits/application/use-cases/get-habit-goal.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'

export function makeGetHabitGoalUseCase() {
  return new GetHabitGoalUseCase(new DrizzleHabitGoalRepository(getDatabase()))
}
