import type { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import type { PaginationInput } from './participant-repository.js'

export interface PracticeRecordPage {
  records: PracticeRecord[]
  total: number
}

// Defines practice record persistence operations required by the use cases.
export abstract class PracticeRecordRepository {
  // Returns false, without saving, if the goal was closed in the meantime (R3).
  abstract create(record: PracticeRecord): Promise<boolean>
  // Lists one page of a goal's records ordered by date and UUID.
  abstract findManyByGoalId(
    goalId: string,
    pagination: PaginationInput,
  ): Promise<PracticeRecordPage>
  abstract findById(id: string): Promise<PracticeRecord | null>
  // Sums the quantities of every record of the goal on the date (0 if none).
  abstract sumQuantityByGoalIdAndDate(
    goalId: string,
    date: string,
  ): Promise<number>
}
