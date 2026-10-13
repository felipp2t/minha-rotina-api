import { GetPracticeRecordUseCase } from '../../../domain/habits/application/use-cases/get-practice-record.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'
import { DrizzlePracticeRecordRepository } from '../../db/drizzle/repositories/practice-record-repository.js'

// Connects the single record lookup to the PostgreSQL repositories.
export function makeGetPracticeRecordUseCase() {
  const database = getDatabase()
  return new GetPracticeRecordUseCase(
    new DrizzleHabitGoalRepository(database),
    new DrizzlePracticeRecordRepository(database),
  )
}
