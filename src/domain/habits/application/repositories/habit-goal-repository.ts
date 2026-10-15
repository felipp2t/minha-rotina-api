import type { HabitGoal } from '../../enterprise/entities/habit-goal.js'

import type { PaginationInput } from './participant-repository.js'

export interface HabitGoalPage {
  goals: HabitGoal[]
  total: number
}

export abstract class HabitGoalRepository {
  abstract close(id: string): Promise<HabitGoal | null>
  abstract create(goal: HabitGoal): Promise<boolean>
  abstract findByParticipantId(
    participantId: string,
    input: PaginationInput,
  ): Promise<HabitGoalPage>
  abstract findById(id: string): Promise<HabitGoal | null>
}
