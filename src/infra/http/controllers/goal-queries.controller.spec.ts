import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryParticipantRepository } from '../../../../test/repositories/in-memory-participant-repository.js'
import { buildApp } from '../../../app.js'
import { GetHabitGoalUseCase } from '../../../domain/habits/application/use-cases/get-habit-goal.js'
import { GetParticipantGoalsUseCase } from '../../../domain/habits/application/use-cases/get-participant-goals.js'
import { HabitGoal } from '../../../domain/habits/enterprise/entities/habit-goal.js'
import { Participant } from '../../../domain/habits/enterprise/entities/participant.js'
import { toHabitGoalDto } from '../schemas/habit-goal.schema.js'

const { getFactory, listFactory } = vi.hoisted(() => ({
  getFactory: vi.fn(),
  listFactory: vi.fn(),
}))
vi.mock('../factories/make-get-habit-goal-use-case.js', () => ({
  makeGetHabitGoalUseCase: getFactory,
}))
vi.mock('../factories/make-get-participant-goals-use-case.js', () => ({
  makeGetParticipantGoalsUseCase: listFactory,
}))
let app: ReturnType<typeof buildApp>
let goals: InMemoryHabitGoalRepository
let participant: Participant
beforeEach(async () => {
  goals = new InMemoryHabitGoalRepository()
  const participants = new InMemoryParticipantRepository()
  participant = Participant.create({ name: 'Ana', email: 'ana@example.com' })
  await participants.create(participant)
  getFactory.mockReturnValue(new GetHabitGoalUseCase(goals))
  listFactory.mockReturnValue(
    new GetParticipantGoalsUseCase(goals, participants),
  )
  app = buildApp()
})
afterEach(async () => {
  await app.close()
  vi.clearAllMocks()
})
const listUrl = () => `/participants/${participant.id}/goals`
describe('Goal queries HTTP with in-memory repositories', () => {
  it('returns the exact DTO for a closed goal and lists future/closed goals', async () => {
    const closed = HabitGoal.create({
      participantId: participant.id,
      name: 'Ana',
      dailyTarget: 30,
      unit: 'MINUTES',
      startDate: '2000-01-01',
      closedAt: new Date('2026-10-10T15:00:00Z'),
    })
    const future = HabitGoal.create({
      participantId: participant.id,
      name: 'Zoe',
      dailyTarget: 2000,
      unit: 'ML',
      startDate: '2099-01-01',
    })
    goals.items.push(future, closed)
    const response = await app.inject(`/goals/${closed.id}`)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(toHabitGoalDto(closed))
    const list = await app.inject(listUrl())
    expect(list.statusCode).toBe(200)
    expect(list.json()).toEqual({
      data: [closed, future].map(toHabitGoalDto),
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    })
    const beyond = await app.inject(`${listUrl()}?page=5&limit=1`)
    expect(beyond.json()).toEqual({
      data: [],
      pagination: { page: 5, limit: 1, total: 2, totalPages: 2 },
    })
  })
  it('distinguishes empty lists from missing resources', async () => {
    const empty = await app.inject(listUrl())
    expect(empty.json()).toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
    for (const url of [
      `/goals/${randomUUID()}`,
      `/participants/${randomUUID()}/goals`,
    ]) {
      const response = await app.inject(url)
      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        message: expect.any(String),
        metadata: { fields: [] },
      })
    }
  })
  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=abc',
    'page=',
    'page=9007199254740992',
    'page=9007199254740991&limit=100',
    'limit=0',
    'limit=-1',
    'limit=1.5',
    'limit=101',
    'limit=abc',
    'limit=',
    'page=1&page=2',
    'limit=1&limit=2',
    'extra=1',
  ])('rejects invalid or unknown query parameters: %s', async (query) => {
    const response = await app.inject(`${listUrl()}?${query}`)
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields.length).toBeGreaterThan(0)
    expect(listFactory).not.toHaveBeenCalled()
  })
  it('rejects invalid UUIDs and query parameters on goal lookup', async () => {
    for (const url of [
      '/goals/invalid',
      '/participants/invalid/goals',
      `/goals/${randomUUID()}?page=1`,
    ]) {
      const response = await app.inject(url)
      expect(response.statusCode).toBe(400)
      expect(response.json().metadata.fields.length).toBeGreaterThan(0)
    }
    expect(getFactory).not.toHaveBeenCalled()
    expect(listFactory).not.toHaveBeenCalled()
  })
  it('documents both GET endpoints', async () => {
    await app.ready()
    for (const path of ['/goals/{id}', '/participants/{id}/goals']) {
      const operation = app.swagger().paths?.[path]?.get
      expect(operation).toBeDefined()
      for (const code of ['200', '400', '404'])
        expect(operation?.responses).toHaveProperty(code)
    }
  })
  it('uses the internal error contract when persistence fails', async () => {
    vi.spyOn(goals, 'findByParticipantId').mockRejectedValue(
      new Error('private details'),
    )
    const response = await app.inject(listUrl())
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      message: 'Erro interno do servidor.',
      metadata: { fields: [] },
    })
  })
})
