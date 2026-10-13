import type { HabitGoalRepository } from '../../src/domain/habits/application/repositories/habit-goal-repository.js'
import type { HabitGoal } from '../../src/domain/habits/enterprise/entities/habit-goal.js'

export class InMemoryHabitGoalRepository implements HabitGoalRepository {
  items: HabitGoal[] = []
  async create(goal: HabitGoal) {
    if (
      this.items.some(
        (item) =>
          item.participantId.equals(goal.participantId) &&
          item.normalizedName === goal.normalizedName &&
          item.unit === goal.unit &&
          item.closedAt === null,
      )
    )
      return false
    this.items.push(goal)
    return true
  }
  async findById(id: string) {
    return this.items.find((goal) => goal.id.toString() === id) ?? null
  }
}
