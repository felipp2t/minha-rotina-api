import { Entity } from '../../../../core/entities/entity.js'
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'

export interface ParticipantProps {
  name: string
  email: string
}

// Encapsulates participant data independently of HTTP and persistence.
export class Participant extends Entity<ParticipantProps> {
  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email
  }

  static create(props: ParticipantProps, id?: UniqueEntityID) {
    return new Participant({ ...props }, id)
  }
}
