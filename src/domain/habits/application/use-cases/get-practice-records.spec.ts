import { describe, expect, it } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryPracticeRecordRepository } from '../../../../../test/repositories/in-memory-practice-record-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { GetPracticeRecordsUseCase } from './get-practice-records.js'

function setup(closedAt: Date | null = null) {
  const goals = new InMemoryHabitGoalRepository()
  const records = new InMemoryPracticeRecordRepository()
  const goal = HabitGoal.create({
    participantId: new UniqueEntityID(),
    name: 'Caminhar',
    dailyTarget: 30,
    unit: 'MINUTES',
    startDate: '2026-10-01',
    closedAt,
  })
  goals.items.push(goal)
  const add = (date: string, id: string, goalId = goal.id) =>
    records.items.push(
      PracticeRecord.create(
        { goalId, date, quantity: 10 },
        new UniqueEntityID(id),
      ),
    )
  const useCase = new GetPracticeRecordsUseCase(goals, records)
  return { goal, add, useCase }
}

describe('Get practice records', () => {
  it('orders by date and UUID before paginating, with complete totals', async () => {
    const { goal, add, useCase } = setup()
    add('2026-10-03', 'c')
    add('2026-10-02', 'b')
    add('2026-10-02', 'a')
    add('2026-10-02', 'z', new UniqueEntityID()) // another goal

    const result = await useCase.execute({
      goalId: goal.id.toString(),
      page: 1,
      limit: 2,
    })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    expect(result.value.records.map((record) => record.id.toString())).toEqual([
      'a',
      'b',
    ])
    expect(result.value.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    })
  })

  it('returns an empty page with real totals beyond the last page', async () => {
    const { goal, add, useCase } = setup()
    add('2026-10-02', 'a')

    const result = await useCase.execute({
      goalId: goal.id.toString(),
      page: 3,
      limit: 20,
    })

    expect(result.value).toEqual({
      records: [],
      pagination: { page: 3, limit: 20, total: 1, totalPages: 1 },
    })
  })

  it('returns zero totalPages for an empty history', async () => {
    const { goal, useCase } = setup()

    const result = await useCase.execute({
      goalId: goal.id.toString(),
      page: 1,
      limit: 20,
    })

    expect(result.value).toEqual({
      records: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  })

  it('keeps the history of a closed goal available', async () => {
    const { goal, add, useCase } = setup(new Date('2026-10-05T12:00:00Z'))
    add('2026-10-02', 'a')

    const result = await useCase.execute({
      goalId: goal.id.toString(),
      page: 1,
      limit: 20,
    })

    expect(result.isRight()).toBe(true)
  })

  it('returns not found for an unknown goal', async () => {
    const { useCase } = setup()

    const result = await useCase.execute({
      goalId: new UniqueEntityID().toString(),
      page: 1,
      limit: 20,
    })

    expect(result.value).toBeInstanceOf(HabitGoalNotFoundError)
  })
})
