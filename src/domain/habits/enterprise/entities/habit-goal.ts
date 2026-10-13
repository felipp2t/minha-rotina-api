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

// Shares goal data with creation, lookup and practice use cases.
export class HabitGoal extends Entity<HabitGoalProps> {
  get participantId() {
    return this.props.participantId
  }

  get name() {
    return this.props.name
  }

  get normalizedName() {
    return this.props.name.trim().toLowerCase()
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

  close(at: Date) {
    this.props.closedAt ??= at
  }

  static create(
    props: Omit<HabitGoalProps, 'closedAt'> & { closedAt?: Date | null },
    id?: UniqueEntityID,
  ) {
    return new HabitGoal(
      { ...props, name: props.name.trim(), closedAt: props.closedAt ?? null },
      id,
    )
  }
}
