import { describe, expect, it, vi } from 'vitest'
import { InMemoryParticipantRepository } from '../../../../../test/repositories/in-memory-participant-repository.js'
import { CreateParticipantUseCase } from './create-participant.js'
import { ParticipantAlreadyExistsError } from './errors/participant-already-exists-error.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('Create participant', () => {
  it('normalizes name and email and generates a UUID', async () => {
    const repository = new InMemoryParticipantRepository()
    
    const result = await new CreateParticipantUseCase(repository).execute({
      name: ' Ana Silva ',
      email: ' ANA@EXAMPLE.COM ',
    })

    expect(result.isRight()).toBe(true)
    expect(repository.items).toEqual([
      {
        id: expect.stringMatching(uuidPattern),
        name: 'Ana Silva',
        email: 'ana@example.com',
      },
    ])
  })

  it('rejects a normalized duplicate without creating another participant', async () => {
    const repository = new InMemoryParticipantRepository()
    
    const useCase = new CreateParticipantUseCase(repository)
    
    await useCase.execute({ name: 'Ana', email: 'ana@example.com' })
    
    const result = await useCase.execute({
      name: 'Outra',
      email: ' ANA@EXAMPLE.COM ',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ParticipantAlreadyExistsError)
    expect(repository.items).toHaveLength(1)
  })

  it('translates a uniqueness conflict that happens after the initial lookup', async () => {
    const repository = new InMemoryParticipantRepository()
    
    vi.spyOn(repository, 'create').mockResolvedValue(false)
    
    const result = await new CreateParticipantUseCase(repository).execute({
      name: 'Ana',
      email: 'ana@example.com',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ParticipantAlreadyExistsError)
  })
})
