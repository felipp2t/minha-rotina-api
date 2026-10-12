import { randomUUID } from 'node:crypto'

export interface ParticipantProps {
  name: string
  email: string
}

// Encapsulates participant data independently of HTTP and persistence.
export class Participant {
  private constructor(
    private readonly props: ParticipantProps,
    readonly id: string,
  ) {}

  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email
  }

  static create(props: ParticipantProps, id: string = randomUUID()) {
    return new Participant({ ...props }, id)
  }
}
