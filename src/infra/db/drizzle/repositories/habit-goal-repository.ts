import { and, eq, isNull, sql } from 'drizzle-orm'
import type { HabitGoalRepository } from '../../../../domain/habits/application/repositories/habit-goal-repository.js'
import type {
  HabitGoal,
  HabitGoalUnit,
} from '../../../../domain/habits/enterprise/entities/habit-goal.js'
import type { Database } from '../../database.js'
import { DrizzleHabitGoalMapper } from '../mappers/drizzle-habit-goal-mapper.js'
import { habitGoals } from '../schema/habit-goals.js'

export class DrizzleHabitGoalRepository implements HabitGoalRepository {
  constructor(private readonly database: Database) {}

  async create(goal: HabitGoal): Promise<boolean> {
    const rows = await this.database.db
      .insert(habitGoals)
      .values(DrizzleHabitGoalMapper.toDrizzle(goal))
      .onConflictDoNothing({
        target: [
          habitGoals.participantId,
          habitGoals.normalizedName,
          habitGoals.unit,
        ],
        where: sql`${habitGoals.closedAt} is null`,
      })
      .returning({ id: habitGoals.id })
    return rows.length === 1
  }

  async findById(id: string): Promise<HabitGoal | null> {
    const [row] = await this.database.db
      .select()
      .from(habitGoals)
      .where(eq(habitGoals.id, id))
      .limit(1)
    return row ? DrizzleHabitGoalMapper.toDomain(row) : null
  }

  async findActiveByParticipantNameAndUnit(
    participantId: string,
    normalizedName: string,
    unit: HabitGoalUnit,
  ): Promise<HabitGoal | null> {
    const [row] = await this.database.db
      .select()
      .from(habitGoals)
      .where(
        and(
          eq(habitGoals.participantId, participantId),
          eq(habitGoals.normalizedName, normalizedName),
          eq(habitGoals.unit, unit),
          isNull(habitGoals.closedAt),
        ),
      )
      .limit(1)
    return row ? DrizzleHabitGoalMapper.toDomain(row) : null
  }
}
