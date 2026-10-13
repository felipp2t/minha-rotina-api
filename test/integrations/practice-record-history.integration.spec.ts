import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app.js'
import { setDatabase } from '../../src/infra/db/database.js'
import { habitGoals } from '../../src/infra/db/drizzle/schema/habit-goals.js'
import { participants } from '../../src/infra/db/drizzle/schema/participants.js'
import { practiceRecords } from '../../src/infra/db/drizzle/schema/practice-records.js'
import { createTestDatabase } from '../infra/db/test-database.js'

const app = buildApp()
let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>

beforeAll(async () => {
  testDatabase = await createTestDatabase()
  setDatabase(testDatabase.database)
  await app.ready()
})
beforeEach(async () => {
  await testDatabase.database.db.execute(sql`TRUNCATE participants CASCADE`)
})
afterAll(async () => {
  await app.close()
  setDatabase(undefined)
  if (testDatabase) await testDatabase.close()
})

async function insertGoal(closedAt: string | null = null) {
  const participantId = randomUUID()
  await testDatabase.database.db.insert(participants).values({
    id: participantId,
    name: 'Ana Silva',
    email: `${participantId}@example.com`,
  })
  const id = randomUUID()
  await testDatabase.database.db.insert(habitGoals).values({
    id,
    participantId,
    name: 'Caminhar',
    normalizedName: 'caminhar',
    dailyTarget: 30,
    unit: 'MINUTES',
    startDate: '2026-10-01',
    closedAt,
  })
  return id
}

async function insertRecord(goalId: string, date: string, id = randomUUID()) {
  const record = { id, goalId, date, quantity: 15 }
  await testDatabase.database.db.insert(practiceRecords).values(record)
  return record
}

function get(url: string) {
  return app.inject({ method: 'GET', url })
}

describe('Practice record history HTTP API with PostgreSQL', () => {
  it('orders by date and UUID before paginating, with complete totals', async () => {
    const goalId = await insertGoal()
    const otherGoalId = await insertGoal()
    const late = await insertRecord(
      goalId,
      '2026-10-03',
      '00000000-0000-4000-8000-000000000001',
    )
    const second = await insertRecord(
      goalId,
      '2026-10-02',
      '00000000-0000-4000-8000-000000000003',
    )
    const first = await insertRecord(
      goalId,
      '2026-10-02',
      '00000000-0000-4000-8000-000000000002',
    )
    await insertRecord(otherGoalId, '2026-10-02')

    const all = await get(`/goals/${goalId}/records`)
    expect(all.statusCode).toBe(200)
    expect(all.json()).toEqual({
      data: [first, second, late],
      pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
    })

    const page = await get(`/goals/${goalId}/records?page=2&limit=2`)
    expect(page.json()).toEqual({
      data: [late],
      pagination: { page: 2, limit: 2, total: 3, totalPages: 2 },
    })
  })

  it('returns real totals beyond the last page and zero pages when empty', async () => {
    const goalId = await insertGoal()

    const empty = await get(`/goals/${goalId}/records`)
    expect(empty.json()).toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    await insertRecord(goalId, '2026-10-02')
    const beyond = await get(`/goals/${goalId}/records?page=5&limit=1`)
    expect(beyond.statusCode).toBe(200)
    expect(beyond.json()).toEqual({
      data: [],
      pagination: { page: 5, limit: 1, total: 1, totalPages: 1 },
    })
  })

  it('accepts limit 1 and 100', async () => {
    const goalId = await insertGoal()
    for (const limit of [1, 100]) {
      const response = await get(`/goals/${goalId}/records?limit=${limit}`)
      expect(response.statusCode).toBe(200)
    }
  })

  it('keeps the history of a closed goal available', async () => {
    const goalId = await insertGoal('2026-10-05T12:00:00Z')
    const record = await insertRecord(goalId, '2026-10-02')

    const list = await get(`/goals/${goalId}/records`)
    expect(list.json().data).toEqual([record])

    const single = await get(`/goals/${goalId}/records/${record.id}`)
    expect(single.statusCode).toBe(200)
    expect(single.json()).toEqual(record)
  })

  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=abc',
    'limit=0',
    'limit=101',
    'limit=1.5',
  ])('rejects invalid pagination: %s', async (query) => {
    const goalId = await insertGoal()
    const response = await get(`/goals/${goalId}/records?${query}`)
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toContainEqual({
      field: query.split('=')[0],
      message: expect.any(String),
    })
  })

  it('rejects unknown query parameters on the listing', async () => {
    const goalId = await insertGoal()
    const response = await get(`/goals/${goalId}/records?pag=1`)
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toEqual([
      { field: 'pag', message: 'Parâmetro não permitido.' },
    ])
  })

  it('returns 404 for a missing goal and 400 for a malformed UUID on the listing', async () => {
    const missing = await get(`/goals/${randomUUID()}/records`)
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toEqual({
      message: 'Meta não encontrada.',
      metadata: { fields: [] },
    })

    const malformed = await get('/goals/invalid/records')
    expect(malformed.statusCode).toBe(400)
    expect(malformed.json().metadata.fields).toContainEqual({
      field: 'id',
      message: expect.any(String),
    })
  })

  it('does not return a record through another goal', async () => {
    const goalId = await insertGoal()
    const otherGoalId = await insertGoal()
    const record = await insertRecord(goalId, '2026-10-02')

    const response = await get(`/goals/${otherGoalId}/records/${record.id}`)
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      message: 'Registro não encontrado.',
      metadata: { fields: [] },
    })
  })

  it('returns 404 for a missing goal or record on the single lookup', async () => {
    const goalId = await insertGoal()
    const record = await insertRecord(goalId, '2026-10-02')

    const missingRecord = await get(`/goals/${goalId}/records/${randomUUID()}`)
    expect(missingRecord.statusCode).toBe(404)
    expect(missingRecord.json().message).toBe('Registro não encontrado.')

    const missingGoal = await get(`/goals/${randomUUID()}/records/${record.id}`)
    expect(missingGoal.statusCode).toBe(404)
    expect(missingGoal.json().message).toBe('Meta não encontrada.')
  })

  it.each([
    ['goalId', 'invalid', randomUUID()],
    ['id', randomUUID(), 'invalid'],
  ])(
    'returns 400 when %s is malformed on the single lookup',
    async (field, goalId, id) => {
      const response = await get(`/goals/${goalId}/records/${id}`)
      expect(response.statusCode).toBe(400)
      expect(response.json().metadata.fields).toContainEqual({
        field,
        message: expect.any(String),
      })
    },
  )

  it('rejects any query parameter on the single lookup', async () => {
    const goalId = await insertGoal()
    const record = await insertRecord(goalId, '2026-10-02')

    const response = await get(`/goals/${goalId}/records/${record.id}?page=1`)
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toEqual([
      { field: 'page', message: 'Parâmetro não permitido.' },
    ])
  })

  it('documents both routes in Swagger', () => {
    const paths = app.swagger().paths
    expect(paths).toHaveProperty('/goals/{id}/records')
    expect(paths?.['/goals/{id}/records']).toHaveProperty('get')
    expect(paths).toHaveProperty('/goals/{goalId}/records/{id}')
  })
})
