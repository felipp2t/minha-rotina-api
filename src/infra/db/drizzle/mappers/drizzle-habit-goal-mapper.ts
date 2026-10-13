import type { InferSelectModel } from 'drizzle-orm'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../../../domain/habits/enterprise/entities/habit-goal.js'
import type { habitGoals } from '../schema/habit-goals.js'

// Converts habit goal rows to domain goals.
export class DrizzleHabitGoalMapper {
  static toDomain(row: InferSelectModel<typeof habitGoals>): HabitGoal {
    return HabitGoal.create(
      {
        participantId: new UniqueEntityID(row.participantId),
        name: row.name,
        dailyTarget: row.dailyTarget,
        unit: row.unit,
        startDate: row.startDate,
        closedAt: row.closedAt ? new Date(row.closedAt) : null,
      },
      new UniqueEntityID(row.id),
    )
  }
}
