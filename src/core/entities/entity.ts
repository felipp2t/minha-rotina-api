import { UniqueEntityID } from './unique-entity-id.js'

// Provides identity, properties and value-based identity comparison to entities.
export abstract class Entity<Props> {
  private readonly _id: UniqueEntityID
  protected props: Props

  protected constructor(props: Props, id?: UniqueEntityID) {
    this.props = props
    this._id = id ?? new UniqueEntityID()
  }

  get id() {
    return this._id
  }

  equals(entity: Entity<unknown>) {
    return this.id.equals(entity.id)
  }
}
