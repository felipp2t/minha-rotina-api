import type { HabitGoal } from '../../enterprise/entities/habit-goal.js'

import type { PaginationInput } from './participant-repository.js'

export interface HabitGoalPage {
  goals: HabitGoal[]
  total: number
}

// A false creation result represents only a duplicate non-closed goal.
// Lookup includes closed goals, so practice use cases can inspect closedAt.
export abstract class HabitGoalRepository {
  // Atomically closes the goal, preserving its first timestamp and commitment.
  abstract close(id: string): Promise<HabitGoal | null>
  abstract create(goal: HabitGoal): Promise<boolean>
  abstract findByParticipantId(
    participantId: string,
    input: PaginationInput,
  ): Promise<HabitGoalPage>
  abstract findById(id: string): Promise<HabitGoal | null>
}
