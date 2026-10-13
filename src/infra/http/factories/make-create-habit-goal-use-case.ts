import { CreateHabitGoalUseCase } from '../../../domain/habits/application/use-cases/create-habit-goal.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'
import { DrizzleParticipantRepository } from '../../db/drizzle/repositories/participant-repository.js'

export function makeCreateHabitGoalUseCase() {
  const database = getDatabase()
  return new CreateHabitGoalUseCase(
    new DrizzleParticipantRepository(database),
    new DrizzleHabitGoalRepository(database),
  )
}
