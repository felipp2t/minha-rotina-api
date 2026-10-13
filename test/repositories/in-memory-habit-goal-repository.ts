import type { HabitGoalRepository } from '../../src/domain/habits/application/repositories/habit-goal-repository.js'
import type { PaginationInput } from '../../src/domain/habits/application/repositories/participant-repository.js'
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
    ) {
      return false
    }
    this.items.push(goal)
    return true
  }

  async findByParticipantId(
    participantId: string,
    { page, limit }: PaginationInput,
  ) {
    const ordered = this.items
      .filter((goal) => goal.participantId.toString() === participantId)
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name) ||
          a.id.toString().localeCompare(b.id.toString()),
      )
    return {
      goals: ordered.slice((page - 1) * limit, page * limit),
      total: ordered.length,
    }
  }

  async findById(id: string) {
    return this.items.find((goal) => goal.id.toString() === id) ?? null
  }
}
