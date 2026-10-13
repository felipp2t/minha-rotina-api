import type { HabitGoal } from '../../enterprise/entities/habit-goal.js'

import type { PaginationInput } from './participant-repository.js'

export interface HabitGoalPage {
  goals: HabitGoal[]
  total: number
}

// A false creation result represents only a duplicate non-closed goal.
// Lookup includes closed goals, so practice use cases can inspect closedAt.
export abstract class HabitGoalRepository {
  abstract create(goal: HabitGoal): Promise<boolean>
  abstract findByParticipantId(
    participantId: string,
    input: PaginationInput,
  ): Promise<HabitGoalPage>
  abstract findById(id: string): Promise<HabitGoal | null>
}
