import { describe, expect, it } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import { HabitGoalNotFoundError } from './errors/habit-goal-not-found-error.js'
import { GetHabitGoalUseCase } from './get-habit-goal.js'

describe('Get habit goal', () => {
  it.each([null, new Date('2026-10-10T15:00:00Z')])(
    'returns active and closed goals: %s',
    async (closedAt) => {
      const repository = new InMemoryHabitGoalRepository()

      const goal = HabitGoal.create({
        participantId: new UniqueEntityID(),
        name: 'Water',
        dailyTarget: 2000,
        unit: 'ML',
        startDate: '2099-01-01',
        closedAt,
      })

      await repository.create(goal)

      const result = await new GetHabitGoalUseCase(repository).execute(
        goal.id.toString(),
      )

      expect(result.isRight()).toBe(true)
      expect(result.value).toBe(goal)
    },
  )

  it('returns not found for an unknown goal', async () => {
    const result = await new GetHabitGoalUseCase(
      new InMemoryHabitGoalRepository(),
    ).execute('missing')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(HabitGoalNotFoundError)
  })
})
