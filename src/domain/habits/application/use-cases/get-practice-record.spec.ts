import { describe, expect, it } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryPracticeRecordRepository } from '../../../../../test/repositories/in-memory-practice-record-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import { PracticeRecord } from '../../enterprise/entities/practice-record.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { PracticeRecordNotFoundError } from './errors/practice-record-not-found-error.js'
import { GetPracticeRecordUseCase } from './get-practice-record.js'

function makeGoal(closedAt: Date | null = null) {
  return HabitGoal.create({
    participantId: new UniqueEntityID(),
    name: 'Caminhar',
    dailyTarget: 30,
    unit: 'MINUTES',
    startDate: '2026-10-01',
    closedAt,
  })
}

function setup(closedAt: Date | null = null) {
  const goals = new InMemoryHabitGoalRepository()
  const records = new InMemoryPracticeRecordRepository()
  const goal = makeGoal(closedAt)
  const otherGoal = makeGoal()
  goals.items.push(goal, otherGoal)
  const record = PracticeRecord.create({
    goalId: goal.id,
    date: '2026-10-02',
    quantity: 15,
  })
  records.items.push(record)
  const useCase = new GetPracticeRecordUseCase(goals, records)
  return { goal, otherGoal, record, useCase }
}

describe('Get practice record', () => {
  it('finds a record inside its goal, even when the goal is closed', async () => {
    const { goal, record, useCase } = setup(new Date('2026-10-05T12:00:00Z'))

    const result = await useCase.execute({
      goalId: goal.id.toString(),
      id: record.id.toString(),
    })

    expect(result.value).toBe(record)
  })

  it('does not return a record through another goal', async () => {
    const { otherGoal, record, useCase } = setup()

    const result = await useCase.execute({
      goalId: otherGoal.id.toString(),
      id: record.id.toString(),
    })

    expect(result.value).toBeInstanceOf(PracticeRecordNotFoundError)
  })

  it('returns not found for an unknown record', async () => {
    const { goal, useCase } = setup()

    const result = await useCase.execute({
      goalId: goal.id.toString(),
      id: new UniqueEntityID().toString(),
    })

    expect(result.value).toBeInstanceOf(PracticeRecordNotFoundError)
  })

  it('returns goal not found for an unknown goal', async () => {
    const { record, useCase } = setup()

    const result = await useCase.execute({
      goalId: new UniqueEntityID().toString(),
      id: record.id.toString(),
    })

    expect(result.value).toBeInstanceOf(HabitGoalNotFoundError)
  })
})
