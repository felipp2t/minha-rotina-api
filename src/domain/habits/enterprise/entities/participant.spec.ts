import { describe, expect, it } from 'vitest'
import { Participant } from './participant.js'

describe('Participant entity', () => {
  it('creates distinct UUIDs and exposes participant data through getters', () => {
    const props = { name: 'Ana', email: 'ana@example.com' }
    const participant = Participant.create(props)
    expect(participant).toBeInstanceOf(Participant)
    expect(participant.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(participant.id).not.toBe(Participant.create(props).id)
    expect(participant.name).toBe('Ana')
    expect(participant.email).toBe('ana@example.com')
  })

  it('preserves the identity when reconstructing a stored participant', () => {
    const id = '72f43a86-cf1a-4d20-b60a-3a9c92e5d8f1'
    const participant = Participant.create(
      { name: 'Ana', email: 'ana@example.com' },
      id,
    )
    expect(participant.id).toBe(id)
  })

  it('copies input properties so external mutation does not change the entity', () => {
    const props = { name: 'Ana', email: 'ana@example.com' }
    const participant = Participant.create(props)
    props.name = 'Outra'
    props.email = 'outra@example.com'
    expect(participant.name).toBe('Ana')
    expect(participant.email).toBe('ana@example.com')
  })
})
