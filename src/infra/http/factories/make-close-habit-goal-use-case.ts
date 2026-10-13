import { CloseHabitGoalUseCase } from '../../../domain/habits/application/use-cases/close-habit-goal.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'

export function makeCloseHabitGoalUseCase() {
  return new CloseHabitGoalUseCase(
    new DrizzleHabitGoalRepository(getDatabase()),
  )
}
