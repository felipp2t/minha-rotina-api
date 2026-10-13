import type { PracticeRecord } from '../../enterprise/entities/practice-record.js'

// Defines practice record persistence operations required by the use cases.
export abstract class PracticeRecordRepository {
  // Returns false, without saving, if the goal was closed in the meantime (R3).
  abstract create(record: PracticeRecord): Promise<boolean>
}
