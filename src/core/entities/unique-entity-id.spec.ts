import { describe, expect, it } from 'vitest'
import { UniqueEntityID } from './unique-entity-id.js'

describe('Unique entity ID', () => {
  it('generates distinct UUIDs when no value is provided', () => {
    const id = new UniqueEntityID()
    expect(id.toString()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(id.equals(new UniqueEntityID())).toBe(false)
  })

  it('preserves an existing ID', () => {
    const value = '72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1'
    expect(new UniqueEntityID(value).toString()).toBe(value)
  })

  it('compares values across separate instances', () => {
    expect(
      new UniqueEntityID('same-id').equals(new UniqueEntityID('same-id')),
    ).toBe(true)
    expect(
      new UniqueEntityID('first-id').equals(new UniqueEntityID('second-id')),
    ).toBe(false)
  })
})
