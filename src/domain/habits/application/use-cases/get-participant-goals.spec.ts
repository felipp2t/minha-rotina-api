import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryParticipantRepository } from '../../../../../test/repositories/in-memory-participant-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import { Participant } from '../../enterprise/entities/participant.js'
import { ParticipantNotFoundError } from './errors/participant-not-found-error.js'
import { GetParticipantGoalsUseCase } from './get-participant-goals.js'

let goals: InMemoryHabitGoalRepository
let participants: InMemoryParticipantRepository
let sut: GetParticipantGoalsUseCase
const participantId = new UniqueEntityID('participant')
beforeEach(async () => {
  goals = new InMemoryHabitGoalRepository()
  participants = new InMemoryParticipantRepository()
  sut = new GetParticipantGoalsUseCase(goals, participants)
  await participants.create(
    Participant.create(
      { name: 'Ana', email: 'ana@example.com' },
      participantId,
    ),
  )
})
describe('List participant goals', () => {
  it('checks participant existence even when the list would be empty', async () => {
    const result = await sut.execute('missing', { page: 1, limit: 20 })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ParticipantNotFoundError)
  })
  it('returns zero pages for an existing participant without goals', async () => {
    const result = await sut.execute('participant', { page: 5, limit: 20 })
    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      goals: [],
      pagination: { page: 5, limit: 20, total: 0, totalPages: 0 },
    })
  })
  it('filters by participant, includes closed and future goals, orders before pagination and preserves totals', async () => {
    for (const [id, name, closedAt] of [
      ['3', 'Zoe', null],
      ['2', 'Ana', null],
      ['1', 'Ana', new Date()],
    ] as const) {
      goals.items.push(
        HabitGoal.create(
          {
            participantId,
            name,
            dailyTarget: 1,
            unit: 'MINUTES',
            startDate: '2099-01-01',
            closedAt,
          },
          new UniqueEntityID(id),
        ),
      )
    }
    goals.items.push(
      HabitGoal.create({
        participantId: new UniqueEntityID('other'),
        name: 'A',
        dailyTarget: 1,
        unit: 'ML',
        startDate: '2000-01-01',
      }),
    )
    const first = await sut.execute('participant', { page: 1, limit: 1 })
    if (first.isLeft()) throw first.value
    expect(first.value.goals[0]?.id.toString()).toBe('1')
    expect(first.value.goals[0]?.isClosed).toBe(true)
    const second = await sut.execute('participant', { page: 2, limit: 1 })
    if (second.isLeft()) throw second.value
    expect(second.value.goals[0]?.id.toString()).toBe('2')
    expect(second.value.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
    })
    const beyond = await sut.execute('participant', { page: 100, limit: 2 })
    expect(beyond.value).toMatchObject({
      goals: [],
      pagination: { page: 100, limit: 2, total: 3, totalPages: 2 },
    })
  })
})
