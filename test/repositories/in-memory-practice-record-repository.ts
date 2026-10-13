import type { PracticeRecordRepository } from '../../src/domain/habits/application/repositories/practice-record-repository.js'
import type { PracticeRecord } from '../../src/domain/habits/enterprise/entities/practice-record.js'

// Provides practice record persistence for unit tests without PostgreSQL.
export class InMemoryPracticeRecordRepository
  implements PracticeRecordRepository
{
  items: PracticeRecord[] = []

  create(record: PracticeRecord): Promise<boolean> {
    this.items.push(record)
    return Promise.resolve(true)
  }
}
