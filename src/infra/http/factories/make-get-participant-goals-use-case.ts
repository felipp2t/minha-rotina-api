import { GetParticipantGoalsUseCase } from '../../../domain/habits/application/use-cases/get-participant-goals.js'
import { getDatabase } from '../../db/database.js'
import { DrizzleHabitGoalRepository } from '../../db/drizzle/repositories/habit-goal-repository.js'
import { DrizzleParticipantRepository } from '../../db/drizzle/repositories/participant-repository.js'

export function makeGetParticipantGoalsUseCase() {
  return new GetParticipantGoalsUseCase(
    new DrizzleHabitGoalRepository(getDatabase()),
    new DrizzleParticipantRepository(getDatabase()),
  )
}
