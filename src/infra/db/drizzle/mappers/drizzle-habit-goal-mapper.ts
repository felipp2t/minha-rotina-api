import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../../../domain/habits/enterprise/entities/habit-goal.js'
import type { habitGoals } from '../schema/habit-goals.js'

// Converts habit goal rows to domain entities and domain entities to insert values.
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

  static toDrizzle(goal: HabitGoal): InferInsertModel<typeof habitGoals> {
    return {
      id: goal.id.toString(),
      participantId: goal.participantId.toString(),
      name: goal.name,
      normalizedName: goal.normalizedName,
      dailyTarget: goal.dailyTarget,
      unit: goal.unit,
      startDate: goal.startDate,
      closedAt: goal.closedAt?.toISOString() ?? null,
    }
  }
}
