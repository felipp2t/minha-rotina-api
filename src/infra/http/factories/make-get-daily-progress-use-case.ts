import { GetDailyProgressUseCase } from '../../../domain/habits/application/use-cases/get-daily-progress.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'
import { DrizzlePracticeRecordRepository } from '../../db/drizzle/repositories/practice-record-repository.js'

// Connects the daily progress calculation to the PostgreSQL repositories.
export function makeGetDailyProgressUseCase() {
  const database = getDatabase()
  return new GetDailyProgressUseCase(
    new DrizzleHabitGoalRepository(database),
    new DrizzlePracticeRecordRepository(database),
  )
}
