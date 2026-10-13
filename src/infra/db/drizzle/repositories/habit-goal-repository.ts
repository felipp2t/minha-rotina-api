import { asc, count, eq, sql } from 'drizzle-orm'
import type { HabitGoalRepository } from '../../../../domain/habits/application/repositories/habit-goal-repository.js'
import type { PaginationInput } from '../../../../domain/habits/application/repositories/participant-repository.js'
import type { HabitGoal } from '../../../../domain/habits/enterprise/entities/habit-goal.js'
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

  findByParticipantId(participantId: string, { page, limit }: PaginationInput) {
    return this.database.db.transaction(
      async (transaction) => {
        const filter = eq(habitGoals.participantId, participantId)
        const [result] = await transaction
          .select({ total: count() })
          .from(habitGoals)
          .where(filter)
        const rows = await transaction
          .select()
          .from(habitGoals)
          .where(filter)
          .orderBy(asc(habitGoals.name), asc(habitGoals.id))
          .limit(limit)
          .offset((page - 1) * limit)
        return {
          goals: rows.map(DrizzleHabitGoalMapper.toDomain),
          total: result?.total ?? 0,
        }
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
  }

  async findById(id: string): Promise<HabitGoal | null> {
    const [row] = await this.database.db
      .select()
      .from(habitGoals)
      .where(eq(habitGoals.id, id))
      .limit(1)
    return row ? DrizzleHabitGoalMapper.toDomain(row) : null
  }
}
