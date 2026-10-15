import type { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import type { PaginationInput } from './participant-repository.js'

export interface PracticeRecordPage {
  records: PracticeRecord[]
  total: number
}

export abstract class PracticeRecordRepository {
  abstract create(record: PracticeRecord): Promise<boolean>
  abstract findManyByGoalId(
    goalId: string,
    pagination: PaginationInput,
  ): Promise<PracticeRecordPage>
  abstract findById(id: string): Promise<PracticeRecord | null>
  abstract sumQuantityByGoalIdAndDate(
    goalId: string,
    date: string,
  ): Promise<number>
}
