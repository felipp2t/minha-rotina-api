import { randomUUID } from 'node:crypto'

// Wraps entity identity and generates UUIDs for new domain entities.
export class UniqueEntityID {
  private readonly value: string

  constructor(value?: string) {
    this.value = value ?? randomUUID()
  }

  toString() {
    return this.value
  }

  equals(id: UniqueEntityID) {
    return this.value === id.toString()
  }
}
