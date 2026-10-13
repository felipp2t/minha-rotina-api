import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
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
// "Today" is 2026-10-13 at noon in São Paulo. Only Date is faked.
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-13T15:00:00Z'))
  await testDatabase.database.db.execute(sql`TRUNCATE participants CASCADE`)
})
afterEach(() => {
  vi.useRealTimers()
})
afterAll(async () => {
  await app.close()
  setDatabase(undefined)
  if (testDatabase) await testDatabase.close()
})

async function insertGoal(
  overrides: { startDate?: string; closedAt?: string } = {},
) {
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
    startDate: '2026-10-09',
    closedAt: null,
    ...overrides,
  })
  return id
}

async function insertRecords(
  goalId: string,
  date: string,
  quantities: number[],
) {
  await testDatabase.database.db.insert(practiceRecords).values(
    quantities.map((quantity) => ({
      id: randomUUID(),
      goalId,
      date,
      quantity,
    })),
  )
}

function progress(goalId: string, query: string) {
  return app.inject({ method: 'GET', url: `/goals/${goalId}/progress${query}` })
}

describe('Daily progress HTTP API with PostgreSQL', () => {
  it('returns the contract example: 15 + 20 against a target of 30', async () => {
    const goalId = await insertGoal()
    await insertRecords(goalId, '2026-10-09', [15, 20])

    const response = await progress(goalId, '?date=2026-10-09')

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      goalId,
      date: '2026-10-09',
      unit: 'MINUTES',
      dailyTarget: 30,
      totalCompleted: 35,
      completed: true,
    })
  })

  it.each([
    { quantities: [29], total: 29, completed: false },
    { quantities: [30], total: 30, completed: true },
    { quantities: [10, 10, 15], total: 35, completed: true },
  ])(
    'marks total $total as completed=$completed',
    async ({ quantities, total, completed }) => {
      const goalId = await insertGoal()
      await insertRecords(goalId, '2026-10-10', quantities)

      const response = await progress(goalId, '?date=2026-10-10')

      expect(response.json()).toMatchObject({
        totalCompleted: total,
        completed,
      })
    },
  )

  it('sums more records than one history page holds', async () => {
    const goalId = await insertGoal()
    await insertRecords(goalId, '2026-10-10', Array(25).fill(2))

    const response = await progress(goalId, '?date=2026-10-10')

    expect(response.json()).toMatchObject({
      totalCompleted: 50,
      completed: true,
    })
  })

  it('counts only the goal and date consulted', async () => {
    const goalId = await insertGoal()
    const otherGoalId = await insertGoal()
    await insertRecords(goalId, '2026-10-11', [100])
    await insertRecords(otherGoalId, '2026-10-10', [100])

    const response = await progress(goalId, '?date=2026-10-10')

    expect(response.json()).toMatchObject({
      totalCompleted: 0,
      completed: false,
    })
  })

  it('accepts the start date and today', async () => {
    const goalId = await insertGoal()
    for (const date of ['2026-10-09', '2026-10-13']) {
      expect((await progress(goalId, `?date=${date}`)).statusCode).toBe(200)
    }
  })

  it('keeps progress available after the goal is closed', async () => {
    const goalId = await insertGoal()
    await insertRecords(goalId, '2026-10-10', [15, 20])
    await testDatabase.database.db.execute(
      sql`UPDATE habit_goals SET closed_at = now() WHERE id = ${goalId}`,
    )

    const response = await progress(goalId, '?date=2026-10-10')

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ totalCompleted: 35 })
  })

  it.each([
    {
      date: '2026-10-08',
      message: 'A data consultada não pode ser anterior ao início da meta.',
    },
    {
      date: '2026-10-14',
      message: 'A data consultada não pode ser posterior a hoje.',
    },
  ])('rejects $date outside the goal period', async ({ date, message }) => {
    const goalId = await insertGoal()

    const response = await progress(goalId, `?date=${date}`)

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message, metadata: { fields: [] } })
  })

  it('rejects today for a goal that starts tomorrow', async () => {
    const goalId = await insertGoal({ startDate: '2026-10-14' })

    const response = await progress(goalId, '?date=2026-10-13')

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toBe(
      'A meta ainda não começou; o progresso pode ser consultado a partir de 2026-10-14.',
    )
  })

  it('follows the São Paulo calendar when UTC is already on the next day', async () => {
    const goalId = await insertGoal()
    vi.setSystemTime(new Date('2026-10-14T02:30:00Z'))

    expect((await progress(goalId, '?date=2026-10-14')).statusCode).toBe(400)
    expect((await progress(goalId, '?date=2026-10-13')).statusCode).toBe(200)
  })

  it.each([
    '',
    '?date=',
    '?date=2026-02-29',
    '?date=2026-10-9',
    '?date=10/10/2026',
  ])('requires a valid calendar date: "%s"', async (query) => {
    const goalId = await insertGoal()

    const response = await progress(goalId, query)

    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toContainEqual({
      field: 'date',
      message: expect.any(String),
    })
  })

  it.each(['page', 'limit', 'extra'])(
    'rejects the unknown query parameter %s',
    async (name) => {
      const goalId = await insertGoal()

      const response = await progress(goalId, `?date=2026-10-10&${name}=1`)

      expect(response.statusCode).toBe(400)
      expect(response.json().metadata.fields).toEqual([
        { field: name, message: 'Parâmetro não permitido.' },
      ])
    },
  )

  it('returns 404 for a missing goal and 400 for a malformed UUID', async () => {
    const missing = await progress(randomUUID(), '?date=2026-10-10')
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toEqual({
      message: 'Meta não encontrada.',
      metadata: { fields: [] },
    })

    const malformed = await progress('invalid', '?date=2026-10-10')
    expect(malformed.statusCode).toBe(400)
    expect(malformed.json().metadata.fields).toContainEqual({
      field: 'id',
      message: expect.any(String),
    })
  })

  it('documents the route in Swagger', () => {
    expect(app.swagger().paths).toHaveProperty('/goals/{id}/progress')
  })
})
