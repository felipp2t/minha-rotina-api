import { Entity } from '../../../../core/entities/entity.js'
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'

export interface PracticeRecordProps {
  goalId: UniqueEntityID
  date: string
  quantity: number
}

// One occurrence of a practice; its quantity uses the unit of its goal.
export class PracticeRecord extends Entity<PracticeRecordProps> {
  get goalId() {
    return this.props.goalId
  }

  get date() {
    return this.props.date
  }

  get quantity() {
    return this.props.quantity
  }

  static create(props: PracticeRecordProps, id?: UniqueEntityID) {
    return new PracticeRecord({ ...props }, id)
  }
}
