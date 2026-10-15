import { CreatePracticeRecordUseCase } from '../../../domain/habits/application/use-cases/create-practice-record.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'
import { DrizzlePracticeRecordRepository } from '../../db/drizzle/repositories/practice-record-repository.js'

export function makeCreatePracticeRecordUseCase() {
  const database = getDatabase()
  return new CreatePracticeRecordUseCase(
    new DrizzleHabitGoalRepository(database),
    new DrizzlePracticeRecordRepository(database),
  )
}
