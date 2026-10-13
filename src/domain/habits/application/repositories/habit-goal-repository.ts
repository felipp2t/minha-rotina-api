import type {
  HabitGoal,
  HabitGoalUnit,
} from '../../enterprise/entities/habit-goal.js'

// A false creation result represents only a duplicate non-closed goal.
// Lookup includes closed goals, so practice use cases can inspect closedAt.
export abstract class HabitGoalRepository {
  abstract create(goal: HabitGoal): Promise<boolean>
  abstract findById(id: string): Promise<HabitGoal | null>
  abstract findActiveByParticipantNameAndUnit(
    participantId: string,
    normalizedName: string,
    unit: HabitGoalUnit,
  ): Promise<HabitGoal | null>
}
