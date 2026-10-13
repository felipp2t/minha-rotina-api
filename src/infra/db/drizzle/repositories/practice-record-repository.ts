import { and, eq, isNull } from 'drizzle-orm'
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
}
