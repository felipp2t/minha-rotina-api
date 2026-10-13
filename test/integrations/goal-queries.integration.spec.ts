import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app.js'
import { setDatabase } from '../../src/infra/db/database.js'
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
async function createGoal(overrides: Record<string, unknown> = {}) {
  const response = await app.inject({
    method: 'POST',
    url: '/goals',
    payload: {
      participantId,
      name: 'Water',
      dailyTarget: 2000,
      unit: 'ML',
      startDate: '2099-01-01',
      ...overrides,
    },
  })
  expect(response.statusCode).toBe(201)
  return response.json<HabitGoalDto>()
}
const listUrl = () => `/participants/${participantId}/goals`

describe('Goal queries HTTP API with PostgreSQL', () => {
  it('returns the exact DTO for active, future and closed goals', async () => {
    const goal = await createGoal()
    const active = await app.inject(`/goals/${goal.id}`)
    expect(active.statusCode).toBe(200)
    expect(active.json()).toEqual(goal)
    await testDatabase.database.db
      .update(habitGoals)
      .set({ closedAt: '2026-10-10T15:00:00Z' })
      .where(eq(habitGoals.id, goal.id))
    const closed = await app.inject(`/goals/${goal.id}`)
    expect(closed.statusCode).toBe(200)
    expect(closed.json()).toEqual({
      ...goal,
      closedAt: '2026-10-10T15:00:00.000Z',
    })
  })
  it('returns 404 for missing resources and 400 for invalid UUIDs', async () => {
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
    for (const url of ['/goals/invalid', '/participants/invalid/goals']) {
      const response = await app.inject(url)
      expect(response.statusCode).toBe(400)
      expect(response.json().metadata.fields).toContainEqual({
        field: 'id',
        message: expect.any(String),
      })
      expect(response.json()).not.toHaveProperty('status')
    }
  })
  it('defaults to page 1/20 and returns zero pages for an empty participant', async () => {
    const response = await app.inject(listUrl())
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  })
  it('filters by participant and orders by name then UUID, including closed and future goals', async () => {
    const z = await createGoal({ name: 'Zoe' })
    const a = await createGoal({ name: 'Ana', unit: 'MINUTES' })
    await testDatabase.database.db
      .update(habitGoals)
      .set({ closedAt: '2026-10-10T15:00:00Z' })
      .where(eq(habitGoals.id, a.id))
    const b = await createGoal({ name: 'Ana', unit: 'REPETITIONS' })
    const other = await app.inject({
      method: 'POST',
      url: '/participants',
      payload: { name: 'Bia', email: 'bia@example.com' },
    })
    await createGoal({ participantId: other.json().id, name: 'A' })
    const expected = [{ ...a, closedAt: '2026-10-10T15:00:00.000Z' }, b]
      .sort((x, y) => x.id.localeCompare(y.id))
      .concat(z)
    const full = await app.inject(listUrl())
    expect(full.statusCode).toBe(200)
    expect(full.json().data).toEqual(expected)
    const second = await app.inject(`${listUrl()}?page=2&limit=1`)
    expect(second.json()).toEqual({
      data: [expected[1]],
      pagination: { page: 2, limit: 1, total: 3, totalPages: 3 },
    })
    const beyond = await app.inject(`${listUrl()}?page=50&limit=2`)
    expect(beyond.statusCode).toBe(200)
    expect(beyond.json()).toEqual({
      data: [],
      pagination: { page: 50, limit: 2, total: 3, totalPages: 2 },
    })
  })
  it('applies the default limit and permits the maximum limit', async () => {
    for (let index = 0; index < 21; index++)
      await createGoal({ name: `Goal ${index.toString().padStart(2, '0')}` })
    const first = await app.inject(listUrl())
    expect(first.json().data).toHaveLength(20)
    expect(first.json().pagination).toEqual({
      page: 1,
      limit: 20,
      total: 21,
      totalPages: 2,
    })
    const last = await app.inject(`${listUrl()}?page=2`)
    expect(last.json().data).toHaveLength(1)
    const max = await app.inject(`${listUrl()}?limit=100`)
    expect(max.statusCode).toBe(200)
    expect(max.json().data).toHaveLength(21)
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
  ])('rejects invalid pagination: %s', async (query) => {
    const response = await app.inject(`${listUrl()}?${query}`)
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields.length).toBeGreaterThan(0)
  })
  it('rejects unknown query parameters on both routes', async () => {
    const goal = await createGoal()
    for (const url of [`/goals/${goal.id}?page=1`, `${listUrl()}?extra=true`]) {
      const response = await app.inject(url)
      expect(response.statusCode).toBe(400)
      expect(response.json().metadata.fields).toContainEqual({
        field: url.includes('extra') ? 'extra' : 'page',
        message: 'Parâmetro não permitido.',
      })
    }
  })
  it('documents success and validation/not-found errors in OpenAPI', () => {
    for (const path of ['/goals/{id}', '/participants/{id}/goals']) {
      const operation = app.swagger().paths?.[path]?.get
      expect(operation).toBeDefined()
      for (const code of ['200', '400', '404'])
        expect(operation?.responses).toHaveProperty(code)
      expect(JSON.stringify(operation)).not.toContain('normalizedName')
    }
  })
})
