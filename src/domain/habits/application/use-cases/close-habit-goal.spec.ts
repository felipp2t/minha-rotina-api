import { afterEach, describe, expect, it, vi } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import { CloseHabitGoalUseCase } from './close-habit-goal.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'

afterEach(() => vi.useRealTimers())
describe('Close habit goal', () => {
  it('preserves the original commitment and first closure, allowing a new goal', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T20:00:00Z'))
    const goals = new InMemoryHabitGoalRepository()
    const props = {
      participantId: new UniqueEntityID(),
      name: 'Water',
      dailyTarget: 2000,
      unit: 'ML' as const,
      startDate: '2000-01-01',
    }
    const goal = HabitGoal.create(props)
    await goals.create(goal)
    const useCase = new CloseHabitGoalUseCase(goals)
    const first = await useCase.execute(goal.id.toString())
    expect(first.isRight()).toBe(true)
    expect(goal.closedAt).toEqual(new Date('2026-10-13T20:00:00Z'))
    vi.setSystemTime(new Date('2026-10-14T20:00:00Z'))
    const repeated = await useCase.execute(goal.id.toString())
    expect(repeated.isRight()).toBe(true)
    expect(goal.closedAt).toEqual(new Date('2026-10-13T20:00:00Z'))
    expect([goal.name, goal.dailyTarget, goal.unit, goal.startDate]).toEqual([
      'Water',
      2000,
      'ML',
      '2000-01-01',
    ])
    expect(
      await goals.create(HabitGoal.create({ ...props, dailyTarget: 3000 })),
    ).toBe(true)
    expect(goals.items).toHaveLength(2)
  })
  it('returns not found for an unknown goal', async () => {
    const result = await new CloseHabitGoalUseCase(
      new InMemoryHabitGoalRepository(),
    ).execute('missing')
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(HabitGoalNotFoundError)
  })
})
