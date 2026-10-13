import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { buildApp } from '../../src/app.js'
import { setDatabase } from '../../src/infra/db/database.js'
import { DrizzleHabitGoalRepository } from '../../src/infra/db/drizzle/repositories/habit-goal-repository.js'
import { habitGoals } from '../../src/infra/db/drizzle/schema/habit-goals.js'
import type { HabitGoalDto } from '../../src/infra/http/schemas/habit-goal.schema.js'
import { createTestDatabase } from '../infra/db/test-database.js'

const app = buildApp()
let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>
let participantId: string
beforeAll(async () => {
  testDatabase = await createTestDatabase()
  setDatabase(testDatabase.database)
  await app.ready()
})
beforeEach(async () => {
  await testDatabase.database.db.execute(sql`TRUNCATE participants CASCADE`)
  const response = await app.inject({
    method: 'POST',
    url: '/participants',
    payload: { name: 'Ana', email: 'ana@example.com' },
  })
  participantId = response.json().id
})
afterAll(async () => {
  await app.close()
  setDatabase(undefined)
  await testDatabase?.close()
})
async function createGoal(dailyTarget = 2000) {
  const response = await app.inject({
    method: 'POST',
    url: '/goals',
    payload: {
      participantId,
      name: 'Water',
      dailyTarget,
      unit: 'ML',
      startDate: '2000-01-01',
    },
  })
  expect(response.statusCode).toBe(201)
  return response.json<HabitGoalDto>()
}
const close = (id: string) =>
  app.inject({ method: 'POST', url: `/goals/${id}/closure` })
const record = (id: string) =>
  app.inject({
    method: 'POST',
    url: `/goals/${id}/records`,
    payload: { date: '2000-01-01', quantity: 500 },
  })

describe('Goal closure HTTP API with PostgreSQL', () => {
  it('preserves the commitment and history, blocks records, and permits a new commitment', async () => {
    const goal = await createGoal()
    const existing = await record(goal.id)
    expect(existing.statusCode).toBe(201)
    const before = Date.now()
    const first = await close(goal.id)
    expect(first.statusCode).toBe(200)
    const dto = first.json<HabitGoalDto>()
    expect(dto).toEqual({ ...goal, closedAt: expect.any(String) })
    expect(Date.parse(dto.closedAt ?? '')).toBeGreaterThanOrEqual(before)
    expect(Date.parse(dto.closedAt ?? '')).toBeLessThanOrEqual(Date.now())
    const repeated = await close(goal.id)
    expect(repeated.statusCode).toBe(200)
    expect(repeated.json()).toEqual(dto)
    expect((await app.inject(`/goals/${goal.id}`)).json()).toEqual(dto)
    expect((await app.inject(`/goals/${goal.id}/records`)).json().data).toEqual(
      [existing.json()],
    )
    expect(
      (await app.inject(`/goals/${goal.id}/progress?date=2000-01-01`)).json(),
    ).toMatchObject({ dailyTarget: 2000, unit: 'ML', totalCompleted: 500 })
    expect((await record(goal.id)).statusCode).toBe(400)
    const replacement = await createGoal(3000)
    expect(replacement.id).not.toBe(goal.id)
    expect(replacement.closedAt).toBeNull()
    expect((await app.inject(`/goals/${goal.id}/records`)).json().data).toEqual(
      [existing.json()],
    )
  })
  it('preserves exactly one instant for concurrent closures', async () => {
    const goal = await createGoal()
    const responses = await Promise.all(
      Array.from({ length: 8 }, () => close(goal.id)),
    )
    for (const response of responses) {
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual(responses[0]?.json())
    }
  })
  it('rejects a practice whose initial lookup happened before a committed closure', async () => {
    const goal = await createGoal()
    const original = DrizzleHabitGoalRepository.prototype.findById
    const lookup = vi
      .spyOn(DrizzleHabitGoalRepository.prototype, 'findById')
      .mockImplementation(async function (
        this: DrizzleHabitGoalRepository,
        id: string,
      ) {
        const stale = await original.call(this, id)
        const response = await close(id)
        expect(response.statusCode).toBe(200)
        return stale
      })
    try {
      expect((await record(goal.id)).statusCode).toBe(400)
      expect(
        (await app.inject(`/goals/${goal.id}/records`)).json().data,
      ).toEqual([])
    } finally {
      lookup.mockRestore()
    }
  })
  it('waits for an existing practice lock before committing closure', async () => {
    const goal = await createGoal()
    const db = testDatabase.database.db
    let release!: () => void
    let acquired!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const ready = new Promise<void>((resolve) => {
      acquired = resolve
    })
    const writer = db.transaction(async (transaction) => {
      await transaction
        .select()
        .from(habitGoals)
        .where(eq(habitGoals.id, goal.id))
        .for('share')
      acquired()
      await gate
    })
    await ready
    const closure = close(goal.id)
    try {
      // Observe the real lock wait instead of relying on a timing-only assertion.
      await vi.waitFor(
        async () => {
          const waiting = await db.execute(
            sql`select 1 from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock' and query like '%habit_goals%for update%'`,
          )
          expect(waiting.rows.length).toBeGreaterThan(0)
        },
        { timeout: 3000, interval: 20 },
      )
      const [row] = await db
        .select()
        .from(habitGoals)
        .where(eq(habitGoals.id, goal.id))
      expect(row?.closedAt).toBeNull()
    } finally {
      release()
      await writer
    }
    expect((await closure).statusCode).toBe(200)
    expect((await record(goal.id)).statusCode).toBe(400)
  })
  it.each([
    '/goals/invalid/closure',
    `/goals/${randomUUID()}/closure?page=1`,
    `/goals/${randomUUID()}/closure?extra=1`,
  ])('returns 400 for invalid input: %s', async (url) => {
    const response = await app.inject({ method: 'POST', url })
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields.length).toBeGreaterThan(0)
    expect(response.json()).not.toHaveProperty('status')
  })
  it('returns 404 for a missing goal', async () => {
    const response = await close(randomUUID())
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      message: expect.any(String),
      metadata: { fields: [] },
    })
  })
})
