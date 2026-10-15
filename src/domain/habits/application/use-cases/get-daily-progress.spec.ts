import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryPracticeRecordRepository } from '../../../../../test/repositories/in-memory-practice-record-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import {
  HabitGoal,
  type HabitGoalProps,
} from '../../enterprise/entities/habit-goal.js'
import { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { InvalidProgressDateError } from './errors/invalid-progress-date-error.js'
import { GetDailyProgressUseCase } from './get-daily-progress.js'

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
  const add = (date: string, quantity: number, goalId = goal.id) =>
    records.items.push(PracticeRecord.create({ goalId, date, quantity }))
  const useCase = new GetDailyProgressUseCase(goals, records)
  const progress = (date: string) =>
    useCase.execute({ goalId: goal.id.toString(), date })
  return { goal, add, progress }
}

describe('Get daily progress', () => {
  it('sums every record of the date and keeps the real total above the target', async () => {
    const { goal, add, progress } = setup()
    add('2026-10-10', 15)
    add('2026-10-10', 20)
    add('2026-10-11', 100) // another date
    add('2026-10-10', 100, new UniqueEntityID()) // another goal

    const result = await progress('2026-10-10')

    expect(result.value).toEqual({
      goalId: goal.id.toString(),
      date: '2026-10-10',
      unit: 'MINUTES',
      dailyTarget: 30,
      totalCompleted: 35,
      completed: true,
    })
  })

  it.each([
    { quantities: [10, 19], total: 29, completed: false },
    { quantities: [10, 20], total: 30, completed: true },
    { quantities: [10, 21], total: 31, completed: true },
  ])(
    'marks total $total against a target of 30 as completed=$completed',
    async ({ quantities, total, completed }) => {
      const { add, progress } = setup()
      for (const quantity of quantities) add('2026-10-10', quantity)

      const result = await progress('2026-10-10')

      expect(result.value).toMatchObject({ totalCompleted: total, completed })
    },
  )

  it('returns zero and not completed for a valid day without records', async () => {
    const { progress } = setup()

    const result = await progress('2026-10-12')

    expect(result.value).toMatchObject({ totalCompleted: 0, completed: false })
  })

  it('accepts the start date and today, also for a closed goal', async () => {
    const { add, progress } = setup({
      closedAt: new Date('2026-10-12T15:00:00Z'),
    })
    add('2026-10-09', 30)

    expect((await progress('2026-10-09')).value).toMatchObject({
      totalCompleted: 30,
      completed: true,
    })
    expect((await progress('2026-10-13')).isRight()).toBe(true)
  })

  it.each([
    '2026-10-08',
    '2026-10-14',
  ])('rejects %s outside the goal period', async (date) => {
    const { progress } = setup()

    expect((await progress(date)).value).toBeInstanceOf(
      InvalidProgressDateError,
    )
  })

  it('rejects any date while the goal has not started', async () => {
    const { progress } = setup({ startDate: '2026-10-14' })

    expect((await progress('2026-10-13')).value).toBeInstanceOf(
      InvalidProgressDateError,
    )
  })

  it('returns not found for an unknown goal', async () => {
    const useCase = new GetDailyProgressUseCase(
      new InMemoryHabitGoalRepository(),
      new InMemoryPracticeRecordRepository(),
    )

    const result = await useCase.execute({
      goalId: new UniqueEntityID().toString(),
      date: '2026-10-10',
    })

    expect(result.value).toBeInstanceOf(HabitGoalNotFoundError)
  })
})
