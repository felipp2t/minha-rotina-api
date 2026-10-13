import { GetPracticeRecordsUseCase } from '../../../domain/habits/application/use-cases/get-practice-records.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'
import { DrizzlePracticeRecordRepository } from '../../db/drizzle/repositories/practice-record-repository.js'

// Connects the paginated record history to the PostgreSQL repositories.
export function makeGetPracticeRecordsUseCase() {
  const database = getDatabase()
  return new GetPracticeRecordsUseCase(
    new DrizzleHabitGoalRepository(database),
    new DrizzlePracticeRecordRepository(database),
  )
}
