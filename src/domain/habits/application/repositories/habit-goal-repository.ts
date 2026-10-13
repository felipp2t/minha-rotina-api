import type { HabitGoal } from '../../enterprise/entities/habit-goal.js'

// Defines habit goal persistence operations required by the use cases.
export abstract class HabitGoalRepository {
  abstract findById(id: string): Promise<HabitGoal | null>
}
