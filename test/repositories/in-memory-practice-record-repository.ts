import type { PaginationInput } from '../../src/domain/habits/application/repositories/participant-repository.js'
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

  findManyByGoalId(goalId: string, { page, limit }: PaginationInput) {
    const ordered = this.items
      .filter((item) => item.goalId.toString() === goalId)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.id.toString().localeCompare(b.id.toString()),
      )
    return Promise.resolve({
      records: ordered.slice((page - 1) * limit, page * limit),
      total: ordered.length,
    })
  }

  findById(id: string): Promise<PracticeRecord | null> {
    return Promise.resolve(
      this.items.find((item) => item.id.toString() === id) ?? null,
    )
  }

  sumQuantityByGoalIdAndDate(goalId: string, date: string): Promise<number> {
    return Promise.resolve(
      this.items
        .filter(
          (item) => item.goalId.toString() === goalId && item.date === date,
        )
        .reduce((total, item) => total + item.quantity, 0),
    )
  }
}
