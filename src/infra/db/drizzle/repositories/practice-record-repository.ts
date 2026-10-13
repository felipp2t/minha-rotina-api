import { and, asc, count, eq, isNull, sql } from 'drizzle-orm'
import type { PaginationInput } from '../../../../domain/habits/application/repositories/participant-repository.js'
import type { PracticeRecordRepository } from '../../../../domain/habits/application/repositories/practice-record-repository.js'
import type { PracticeRecord } from '../../../../domain/habits/enterprise/entities/practice-record.js'
import type { Database } from '../../database.js'
import { DrizzlePracticeRecordMapper } from '../mappers/drizzle-practice-record-mapper.js'
import { habitGoals } from '../schema/habit-goals.js'
import { practiceRecords } from '../schema/practice-records.js'

// Persists practice records in PostgreSQL.
export class DrizzlePracticeRecordRepository
  implements PracticeRecordRepository
{
  constructor(private readonly database: Database) {}

  // Locks the goal with FOR SHARE while inserting. If a closure is in progress,
  // this waits for it and then no longer finds the goal open, so nothing is saved.
  create(record: PracticeRecord): Promise<boolean> {
    return this.database.db.transaction(async (transaction) => {
      const [openGoal] = await transaction
        .select({ id: habitGoals.id })
        .from(habitGoals)
        .where(
          and(
            eq(habitGoals.id, record.goalId.toString()),
            isNull(habitGoals.closedAt),
          ),
        )
        .for('share')
      if (!openGoal) {
        return false
      }

      await transaction
        .insert(practiceRecords)
        .values(DrizzlePracticeRecordMapper.toDrizzle(record))
      return true
    })
  }

  // Counts and reads the page in one consistent snapshot, as participants do.
  findManyByGoalId(goalId: string, { page, limit }: PaginationInput) {
    return this.database.db.transaction(
      async (transaction) => {
        const [result] = await transaction
          .select({ total: count() })
          .from(practiceRecords)
          .where(eq(practiceRecords.goalId, goalId))
        const rows = await transaction
          .select()
          .from(practiceRecords)
          .where(eq(practiceRecords.goalId, goalId))
          .orderBy(asc(practiceRecords.date), asc(practiceRecords.id))
          .limit(limit)
          .offset((page - 1) * limit)
        return {
          records: rows.map(DrizzlePracticeRecordMapper.toDomain),
          total: result?.total ?? 0,
        }
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
  }

  async findById(id: string): Promise<PracticeRecord | null> {
    const [row] = await this.database.db
      .select()
      .from(practiceRecords)
      .where(eq(practiceRecords.id, id))
      .limit(1)
    return row ? DrizzlePracticeRecordMapper.toDomain(row) : null
  }

  // SUM over all records of the date, without pagination. PostgreSQL returns
  // the sum of integers as text (bigint), so it is converted to a number.
  async sumQuantityByGoalIdAndDate(goalId: string, date: string) {
    const [result] = await this.database.db
      .select({
        total: sql<string>`coalesce(sum(${practiceRecords.quantity}), 0)`,
      })
      .from(practiceRecords)
      .where(
        and(eq(practiceRecords.goalId, goalId), eq(practiceRecords.date, date)),
      )
    return Number(result?.total ?? 0)
  }
}
