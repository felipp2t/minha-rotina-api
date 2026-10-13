import { describe, expect, it } from 'vitest'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { DrizzleHabitGoalMapper } from '../../../../infra/db/drizzle/mappers/drizzle-habit-goal-mapper.js'
import { toHabitGoalDto } from '../../../../infra/http/schemas/habit-goal.schema.js'
import { HabitGoal } from './habit-goal.js'

function goalProps() {
  return {
    participantId: new UniqueEntityID(),
    name: ' Caminhar ',
    dailyTarget: 30,
    unit: 'MINUTES' as const,
    startDate: '2026-10-09',
  }
}

describe('Habit goal shared with practice records', () => {
  it('keeps the open state and round-trips identity and measurements', () => {
    const goal = HabitGoal.create(goalProps())
    const row = DrizzleHabitGoalMapper.toDrizzle(goal)
    expect(goal.isClosed).toBe(false)
    expect(row.normalizedName).toBe('caminhar')
    expect(row.closedAt).toBeNull()
    const restored = DrizzleHabitGoalMapper.toDomain({
      id: goal.id.toString(),
      participantId: goal.participantId.toString(),
      name: goal.name,
      normalizedName: goal.normalizedName,
      dailyTarget: goal.dailyTarget,
      unit: goal.unit,
      startDate: goal.startDate,
      closedAt: null,
    })
    expect(restored.equals(goal)).toBe(true)
    expect(restored.participantId.equals(goal.participantId)).toBe(true)
    expect(restored.isClosed).toBe(false)
    expect(toHabitGoalDto(restored)).toEqual(toHabitGoalDto(goal))
  })

  it('preserves closedAt as Date in the domain and serializes it for the database and API', () => {
    const closedAt = new Date('2026-10-10T15:00:00Z')
    const goal = HabitGoal.create({ ...goalProps(), closedAt })
    expect(goal.isClosed).toBe(true)
    expect(goal.closedAt).toBeInstanceOf(Date)
    const row = DrizzleHabitGoalMapper.toDrizzle(goal)
    expect(row.closedAt).toBe(closedAt.toISOString())
    expect(toHabitGoalDto(goal).closedAt).toBe(closedAt.toISOString())
    const restored = DrizzleHabitGoalMapper.toDomain({
      id: goal.id.toString(),
      participantId: goal.participantId.toString(),
      name: goal.name,
      normalizedName: goal.normalizedName,
      dailyTarget: goal.dailyTarget,
      unit: goal.unit,
      startDate: goal.startDate,
      closedAt: closedAt.toISOString(),
    })
    expect(restored.closedAt).toEqual(closedAt)
    expect(restored.isClosed).toBe(true)
  })
})
