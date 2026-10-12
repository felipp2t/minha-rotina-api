import { describe, expect, it } from 'vitest'
import { Entity } from './entity.js'
import { UniqueEntityID } from './unique-entity-id.js'

class TestEntity extends Entity<{ name: string }> {
  constructor(id?: UniqueEntityID) {
    super({ name: 'Test' }, id)
  }
}

describe('Entity identity', () => {
  it('assigns an identity to new entities', () => {
    expect(new TestEntity().id).toBeInstanceOf(UniqueEntityID)
  })

  it('considers an entity equal to itself', () => {
    const entity = new TestEntity()
    expect(entity.equals(entity)).toBe(true)
  })

  it('considers reconstructed entities equal by their ID value', () => {
    const first = new TestEntity(new UniqueEntityID('same-id'))
    const reconstructed = new TestEntity(new UniqueEntityID('same-id'))
    expect(first.id).not.toBe(reconstructed.id)
    expect(first.equals(reconstructed)).toBe(true)
  })

  it('distinguishes entities with different identities', () => {
    expect(new TestEntity().equals(new TestEntity())).toBe(false)
  })
})
