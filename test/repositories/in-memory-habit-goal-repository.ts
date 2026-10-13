import type { HabitGoalRepository } from '../../src/domain/habits/application/repositories/habit-goal-repository.js'
import type { HabitGoal } from '../../src/domain/habits/enterprise/entities/habit-goal.js'

// Provides habit goal persistence for unit tests without PostgreSQL.
export class InMemoryHabitGoalRepository implements HabitGoalRepository {
  items: HabitGoal[] = []

  findById(id: string): Promise<HabitGoal | null> {
    return Promise.resolve(
      this.items.find((item) => item.id.toString() === id) ?? null,
    )
  }
}
