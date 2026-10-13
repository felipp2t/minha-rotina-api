import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryPracticeRecordRepository } from '../../../../../test/repositories/in-memory-practice-record-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import {
  HabitGoal,
  type HabitGoalProps,
} from '../../enterprise/entities/habit-goal.js'
import { CreatePracticeRecordUseCase } from './create-practice-record.js'
import { HabitGoalClosedError } from './errors/habit-goal-closed-error.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { InvalidPracticeDateError } from './errors/invalid-practice-date-error.js'

// "Today" in the tests is 2026-10-13 at noon in São Paulo (15:00 UTC).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-13T15:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

function setup(goalProps: Partial<HabitGoalProps> = {}) {
  const goals = new InMemoryHabitGoalRepository()
  const records = new InMemoryPracticeRecordRepository()
  const goal = HabitGoal.create({
    participantId: new UniqueEntityID(),
    name: 'Caminhar',
    dailyTarget: 30,
    unit: 'MINUTES',
    startDate: '2026-10-09',
    closedAt: null,
    ...goalProps,
  })
  goals.items.push(goal)
  const useCase = new CreatePracticeRecordUseCase(goals, records)
  const register = (date: string, quantity = 15) =>
    useCase.execute({ goalId: goal.id.toString(), date, quantity })
  return { records, goal, register }
}

describe('Create practice record', () => {
  it('creates a record linked to the goal', async () => {
    const { records, goal, register } = setup()

    const result = await register('2026-10-10')

    expect(result.isRight()).toBe(true)
    expect(records.items).toHaveLength(1)
    expect(records.items[0]?.goalId.toString()).toBe(goal.id.toString())
    expect(records.items[0]?.date).toBe('2026-10-10')
    expect(records.items[0]?.quantity).toBe(15)
  })

  it('accepts the start date and today (R2)', async () => {
    const { records, register } = setup()

    expect((await register('2026-10-09')).isRight()).toBe(true)
    expect((await register('2026-10-13')).isRight()).toBe(true)
    expect(records.items).toHaveLength(2)
  })

  it('allows several records on the same date beyond the daily target', async () => {
    const { records, register } = setup()

    await register('2026-10-10', 15)
    await register('2026-10-10', 20)
    await register('2026-10-10', 100)

    expect(records.items).toHaveLength(3)
  })

  it.each([
    '2026-10-08', // before the start date
    '2026-10-14', // tomorrow
  ])('rejects %s outside the goal period (R2)', async (date) => {
    const { records, register } = setup()

    const result = await register(date)

    expect(result.value).toBeInstanceOf(InvalidPracticeDateError)
    expect(records.items).toHaveLength(0)
  })

  it('rejects records while the goal has not started (R2)', async () => {
    const { records, register } = setup({ startDate: '2026-10-14' })

    const result = await register('2026-10-13')

    expect(result.value).toBeInstanceOf(InvalidPracticeDateError)
    expect(records.items).toHaveLength(0)
  })

  it('rejects records on a closed goal, even for past dates (R3)', async () => {
    const { records, register } = setup({
      closedAt: new Date('2026-10-12T15:00:00Z'),
    })

    const result = await register('2026-10-10')

    expect(result.value).toBeInstanceOf(HabitGoalClosedError)
    expect(records.items).toHaveLength(0)
  })

  it('rejects the record if the goal is closed during the request (R3)', async () => {
    const { records, register } = setup()
    vi.spyOn(records, 'create').mockResolvedValue(false)

    const result = await register('2026-10-10')

    expect(result.value).toBeInstanceOf(HabitGoalClosedError)
  })

  it('returns not found for an unknown goal', async () => {
    const useCase = new CreatePracticeRecordUseCase(
      new InMemoryHabitGoalRepository(),
      new InMemoryPracticeRecordRepository(),
    )

    const result = await useCase.execute({
      goalId: new UniqueEntityID().toString(),
      date: '2026-10-10',
      quantity: 15,
    })

    expect(result.value).toBeInstanceOf(HabitGoalNotFoundError)
  })

  it('uses the São Paulo calendar near midnight, not UTC', async () => {
    const { register } = setup()
    // 23:30 on 2026-10-13 in São Paulo is already 2026-10-14 in UTC.
    vi.setSystemTime(new Date('2026-10-14T02:30:00Z'))

    expect((await register('2026-10-14')).isLeft()).toBe(true)
    expect((await register('2026-10-13')).isRight()).toBe(true)
  })
})
