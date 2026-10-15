import { randomUUID } from 'node:crypto'

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
