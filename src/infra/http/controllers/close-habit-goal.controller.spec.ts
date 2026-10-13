import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../test/repositories/in-memory-habit-goal-repository.js'
import { buildApp } from '../../../app.js'
import { UniqueEntityID } from '../../../core/entities/unique-entity-id.js'
import { CloseHabitGoalUseCase } from '../../../domain/habits/application/use-cases/close-habit-goal.js'
import { HabitGoal } from '../../../domain/habits/enterprise/entities/habit-goal.js'
import { toHabitGoalDto } from '../schemas/habit-goal.schema.js'

const { factory } = vi.hoisted(() => ({ factory: vi.fn() }))
vi.mock('../factories/make-close-habit-goal-use-case.js', () => ({
  makeCloseHabitGoalUseCase: factory,
}))
let app: ReturnType<typeof buildApp>
let goals: InMemoryHabitGoalRepository
beforeEach(() => {
  goals = new InMemoryHabitGoalRepository()
  factory.mockReturnValue(new CloseHabitGoalUseCase(goals))
  app = buildApp()
})
afterEach(async () => {
  await app.close()
  vi.clearAllMocks()
})
describe('Goal closure HTTP', () => {
  it('returns 200 and exactly the same DTO on repeated closures', async () => {
    const goal = HabitGoal.create({
      participantId: new UniqueEntityID(),
      name: 'Water',
      dailyTarget: 2000,
      unit: 'ML',
      startDate: '2099-01-01',
    })
    await goals.create(goal)
    const first = await app.inject({
      method: 'POST',
      url: `/goals/${goal.id}/closure`,
    })
    expect(first.statusCode).toBe(200)
    expect(first.json()).toEqual(toHabitGoalDto(goal))
    expect(first.json().closedAt).toEqual(expect.any(String))
    const repeated = await app.inject({
      method: 'POST',
      url: `/goals/${goal.id}/closure`,
    })
    expect(repeated.statusCode).toBe(200)
    expect(repeated.json()).toEqual(first.json())
  })
  it.each([
    '/goals/invalid/closure',
    `/goals/${randomUUID()}/closure?page=1`,
    `/goals/${randomUUID()}/closure?extra=1`,
  ])('rejects invalid input: %s', async (url) => {
    const response = await app.inject({ method: 'POST', url })
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields.length).toBeGreaterThan(0)
    expect(response.json()).not.toHaveProperty('status')
    expect(factory).not.toHaveBeenCalled()
  })
  it('returns the public 404 error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/goals/${randomUUID()}/closure`,
    })
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      message: expect.any(String),
      metadata: { fields: [] },
    })
  })
  it('documents closure and its response codes', async () => {
    await app.ready()
    const operation = app.swagger().paths?.['/goals/{id}/closure']?.post
    expect(operation).toBeDefined()
    for (const code of ['200', '400', '404'])
      expect(operation?.responses).toHaveProperty(code)
  })
})
