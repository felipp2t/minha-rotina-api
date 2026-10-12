import { describe, expect, it } from 'vitest'
import { InMemoryParticipantRepository } from '../../../../../test/repositories/in-memory-participant-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { Participant } from '../../enterprise/entities/participant.js'
import { ParticipantNotFoundError } from './errors/participant-not-found-error.js'
import { GetParticipantUseCase } from './get-participant.js'

describe('Get participant', () => {
  it('returns the stored participant', async () => {
    const repository = new InMemoryParticipantRepository()

    const participant = Participant.create(
      { name: 'Ana', email: 'ana@example.com' },
      new UniqueEntityID('participant-id'),
    )

    await repository.create(participant)
    const result = await new GetParticipantUseCase(repository).execute(
      participant.id.toString(),
    )

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual(participant)
  })

  it('returns the domain error for a missing participant', async () => {
    const result = await new GetParticipantUseCase(
      new InMemoryParticipantRepository(),
    ).execute('missing-id')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ParticipantNotFoundError)
  })
})
