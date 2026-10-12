import { describe, expect, it } from 'vitest'
import { InMemoryParticipantRepository } from '../../../../../test/repositories/in-memory-participant-repository.js'
import { Participant } from '../../enterprise/entities/participant.js'
import { GetParticipantsUseCase } from './get-participants.js'

describe('List participants', () => {
  it('orders before slicing and computes totals independently of the page', async () => {
    const repository = new InMemoryParticipantRepository()

    for (const [id, name] of [
      ['3', 'Zoe'],
      ['2', 'Ana'],
      ['1', 'Ana'],
    ]) {
      await repository.create(
        Participant.create(
          { name: name ?? '', email: `${id}@example.com` },
          id ?? '',
        ),
      )
    }

    const result = await new GetParticipantsUseCase(repository).execute({
      page: 2,
      limit: 1,
    })

    expect(result.participants.map((participant) => participant.id)).toEqual([
      '2',
    ])

    expect(result.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
    })
  })

  it('preserves requested page and totals beyond the final page', async () => {
    const repository = new InMemoryParticipantRepository()

    await repository.create(
      Participant.create({ name: 'Ana', email: 'ana@example.com' }, '1'),
    )

    const result = await new GetParticipantsUseCase(repository).execute({
      page: 3,
      limit: 20,
    })

    expect(result).toEqual({
      participants: [],
      pagination: { page: 3, limit: 20, total: 1, totalPages: 1 },
    })
  })

  it('reports zero pages when there are no participants', async () => {
    const result = await new GetParticipantsUseCase(
      new InMemoryParticipantRepository(),
    ).execute({ page: 1, limit: 20 })

    expect(result.pagination.totalPages).toBe(0)
  })
})
