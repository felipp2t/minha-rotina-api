import { Entity } from '../../../../core/entities/entity.js'
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'

export type HabitGoalUnit = 'ML' | 'MINUTES' | 'REPETITIONS'

export interface HabitGoalProps {
  participantId: UniqueEntityID
  name: string
  dailyTarget: number
  unit: HabitGoalUnit
  startDate: string
  closedAt: Date | null
}

// Daily goal whose target and unit stay fixed; closing it preserves its history.
export class HabitGoal extends Entity<HabitGoalProps> {
  get participantId() {
    return this.props.participantId
  }

  get name() {
    return this.props.name
  }

  get dailyTarget() {
    return this.props.dailyTarget
  }

  get unit() {
    return this.props.unit
  }

  get startDate() {
    return this.props.startDate
  }

  get closedAt() {
    return this.props.closedAt
  }

  get isClosed() {
    return this.props.closedAt !== null
  }

  static create(props: HabitGoalProps, id?: UniqueEntityID) {
    return new HabitGoal({ ...props }, id)
  }
}
