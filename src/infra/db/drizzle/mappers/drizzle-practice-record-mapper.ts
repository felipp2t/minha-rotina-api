import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { PracticeRecord } from '../../../../domain/habits/enterprise/entities/practice-record.js'
import type { practiceRecords } from '../schema/practice-records.js'

export class DrizzlePracticeRecordMapper {
  static toDomain(
    row: InferSelectModel<typeof practiceRecords>,
  ): PracticeRecord {
    return PracticeRecord.create(
      {
        goalId: new UniqueEntityID(row.goalId),
        date: row.date,
        quantity: row.quantity,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toDrizzle(
    record: PracticeRecord,
  ): InferInsertModel<typeof practiceRecords> {
    return {
      id: record.id.toString(),
      goalId: record.goalId.toString(),
      date: record.date,
      quantity: record.quantity,
    }
  }
}
