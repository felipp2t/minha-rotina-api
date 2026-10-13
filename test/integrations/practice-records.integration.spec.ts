import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
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
import type { PracticeRecordDto } from '../../src/infra/http/schemas/practice-record.schema.js'
import { createTestDatabase } from '../infra/db/test-database.js'

const app = buildApp()
let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>

// Noon of 2026-10-13 in São Paulo. Only `Date` is faked, so PostgreSQL timers keep working.
const NOW = new Date('2026-10-13T15:00:00Z')

beforeAll(async () => {
  testDatabase = await createTestDatabase()

  setDatabase(testDatabase.database)

  await app.ready()
})

beforeEach(async () => {
  vi.restoreAllMocks()

  vi.useFakeTimers({ toFake: ['Date'] })

  vi.setSystemTime(NOW)

  await testDatabase.database.db.execute(sql`TRUNCATE participants CASCADE`)
})

afterEach(() => {
  vi.useRealTimers()
})

afterAll(async () => {
  vi.restoreAllMocks()

  await app.close()

  setDatabase(undefined)

  const databaseClose = testDatabase?.close()

  if (databaseClose) await databaseClose
})

async function insertGoal(
  overrides: Partial<typeof habitGoals.$inferInsert> = {},
) {
  const participantId = randomUUID()

  await testDatabase.database.db.insert(participants).values({
    id: participantId,
    name: 'Ana Silva',
    email: `${participantId}@example.com`,
  })

  const goal = {
    id: randomUUID(),
    participantId,
    name: 'Caminhar',
    normalizedName: 'caminhar',
    dailyTarget: 30,
    unit: 'MINUTES' as const,
    startDate: '2026-10-09',
    closedAt: null,
    ...overrides,
  }

  await testDatabase.database.db.insert(habitGoals).values(goal)
  return goal
}

function postRecord(goalId: string, payload: unknown, query = '') {
  return app.inject({
    method: 'POST',
    url: `/goals/${goalId}/records${query}`,
    payload: payload as Record<string, unknown>,
  })
}

function storedRecords(goalId: string) {
  return testDatabase.database.db
    .select()
    .from(practiceRecords)
    .where(eq(practiceRecords.goalId, goalId))
}

describe('Practice record creation HTTP API with PostgreSQL', () => {
  it('creates and persists a record in the contract format', async () => {
    const goal = await insertGoal()

    const response = await postRecord(goal.id, {
      date: '2026-10-10',
      quantity: 15,
    })

    expect(response.statusCode).toBe(201)
    expect(response.headers.location).toBeUndefined()

    const record = response.json<PracticeRecordDto>()

    expect(record).toEqual({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
      goalId: goal.id,
      date: '2026-10-10',
      quantity: 15,
    })

    const stored = await storedRecords(goal.id)

    expect(stored).toEqual([record])
  })

  it('inherits the unit from the goal instead of accepting one', async () => {
    const goal = await insertGoal()

    const response = await postRecord(goal.id, {
      date: '2026-10-10',
      quantity: 15,
      unit: 'ML',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toEqual([
      { field: 'unit', message: 'Campo não permitido.' },
    ])

    const stored = await storedRecords(goal.id)

    expect(stored).toHaveLength(0)
  })

  it('allows several records on the same date and totals above the target', async () => {
    const goal = await insertGoal()

    for (const quantity of [15, 20, 100]) {
      const response = await postRecord(goal.id, {
        date: '2026-10-10',
        quantity,
      })
      expect(response.statusCode).toBe(201)
    }

    const stored = await storedRecords(goal.id)

    expect(
      stored.map((record) => record.quantity).sort((a, b) => a - b),
    ).toEqual([15, 20, 100])
  })

  it('accepts the start date and today as inclusive limits (R2)', async () => {
    const goal = await insertGoal()

    for (const date of ['2026-10-09', '2026-10-13']) {
      const response = await postRecord(goal.id, { date, quantity: 1 })
      expect(response.statusCode).toBe(201)
    }
  })

  it.each([
    {
      date: '2026-10-08',
      message: 'A data da prática não pode ser anterior ao início da meta.',
    },
    {
      date: '2026-10-14',
      message: 'A data da prática não pode ser posterior a hoje.',
    },
  ])(
    'rejects $date outside the goal period (R2)',
    async ({ date, message }) => {
      const goal = await insertGoal()

      const response = await postRecord(goal.id, { date, quantity: 15 })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ message, metadata: { fields: [] } })

      const stored = await storedRecords(goal.id)

      expect(stored).toHaveLength(0)
    },
  )

  it('rejects records today on a goal that starts tomorrow (R2)', async () => {
    const goal = await insertGoal({ startDate: '2026-10-14' })

    const response = await postRecord(goal.id, {
      date: '2026-10-13',
      quantity: 15,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message:
        'A meta ainda não começou; registros são aceitos a partir de 2026-10-14.',
      metadata: { fields: [] },
    })
  })

  it('follows the São Paulo calendar when UTC is already on the next day', async () => {
    const goal = await insertGoal()
    vi.setSystemTime(new Date('2026-10-14T02:30:00Z'))

    const tomorrow = await postRecord(goal.id, {
      date: '2026-10-14',
      quantity: 15,
    })

    const today = await postRecord(goal.id, {
      date: '2026-10-13',
      quantity: 15,
    })

    expect(tomorrow.statusCode).toBe(400)
    expect(today.statusCode).toBe(201)
  })

  it.each(['2026-10-13', '2026-10-10'])(
    'rejects %s on a closed goal, including late records (R3)',
    async (date) => {
      const goal = await insertGoal({ closedAt: '2026-10-12T15:00:00Z' })

      const response = await postRecord(goal.id, { date, quantity: 15 })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        message: 'A meta está encerrada e não aceita novos registros.',
        metadata: { fields: [] },
      })

      const stored = await storedRecords(goal.id)

      expect(stored).toHaveLength(0)
    },
  )

  it('does not accept a record after a concurrent closure commits (R3)', async () => {
    const goal = await insertGoal()

    const closer = await testDatabase.database.db.$client.connect()

    try {
      // Holds the closure open so the record request must wait for its outcome.
      await closer.query('BEGIN')
      await closer.query(
        'UPDATE habit_goals SET closed_at = now() WHERE id = $1',
        [goal.id],
      )

      const pending = postRecord(goal.id, { date: '2026-10-10', quantity: 15 })

      await vi.waitFor(
        async () => {
          const { rows } = await testDatabase.database.db.$client.query<{
            waiting: number
          }>(
            `SELECT count(*)::int AS waiting FROM pg_stat_activity
             WHERE datname = current_database() AND wait_event_type = 'Lock'`,
          )
          expect(rows[0]?.waiting).toBe(1)
        },
        { timeout: 5000, interval: 20 },
      )

      await closer.query('COMMIT')

      const response = await pending

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toBe(
        'A meta está encerrada e não aceita novos registros.',
      )
      const stored = await storedRecords(goal.id)

      expect(stored).toHaveLength(0)
    } finally {
      await closer.query('ROLLBACK').catch(() => undefined)
      closer.release()
    }
  })

  it('returns 404 for a missing goal and 400 for a malformed UUID', async () => {
    const missing = await postRecord(randomUUID(), {
      date: '2026-10-10',
      quantity: 15,
    })

    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toEqual({
      message: 'Meta não encontrada.',
      metadata: { fields: [] },
    })

    const malformed = await postRecord('invalid', {
      date: '2026-10-10',
      quantity: 15,
    })

    expect(malformed.statusCode).toBe(400)
    expect(malformed.json().metadata.fields).toContainEqual({
      field: 'id',
      message: expect.any(String),
    })
  })

  it.each([
    { payload: { date: '2026-10-10', quantity: 0 }, field: 'quantity' },
    { payload: { date: '2026-10-10', quantity: -1 }, field: 'quantity' },
    { payload: { date: '2026-10-10', quantity: 1.5 }, field: 'quantity' },
    { payload: { date: '2026-10-10', quantity: '15' }, field: 'quantity' },
    {
      payload: { date: '2026-10-10', quantity: 2_147_483_648 },
      field: 'quantity',
    },
    { payload: { date: '2026-10-10' }, field: 'quantity' },
    { payload: { date: '2026-02-29', quantity: 15 }, field: 'date' },
    { payload: { date: '2026-04-31', quantity: 15 }, field: 'date' },
    { payload: { date: '2026-10-9', quantity: 15 }, field: 'date' },
    { payload: { date: '10/10/2026', quantity: 15 }, field: 'date' },
    { payload: { date: '2026-10-10T10:00:00Z', quantity: 15 }, field: 'date' },
    { payload: { quantity: 15 }, field: 'date' },
  ])('rejects invalid $field: $payload', async ({ payload, field }) => {
    const goal = await insertGoal()

    const response = await postRecord(goal.id, payload)

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toBe('Campos inválidos.')
    expect(response.json().metadata.fields).toContainEqual({
      field,
      message: expect.any(String),
    })

    const stored = await storedRecords(goal.id)
    expect(stored).toHaveLength(0)
  })

  it('reports unknown body fields as in the contract example', async () => {
    const goal = await insertGoal()

    const response = await postRecord(goal.id, {
      date: '2026-10-10',
      quantity: 15,
      observacao: 'manhã',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: 'Campos inválidos.',
      metadata: {
        fields: [{ field: 'observacao', message: 'Campo não permitido.' }],
      },
    })
  })

  it('reports both the unknown field and the missing one for a typo', async () => {
    const goal = await insertGoal()

    const response = await postRecord(goal.id, {
      date: '2026-10-10',
      quantidad: 15,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toEqual(
      expect.arrayContaining([
        { field: 'quantidad', message: 'Campo não permitido.' },
        { field: 'quantity', message: 'Informe um inteiro positivo.' },
      ]),
    )
  })

  it('rejects unknown query parameters', async () => {
    const goal = await insertGoal()

    const response = await postRecord(
      goal.id,
      { date: '2026-10-10', quantity: 15 },
      '?pag=1',
    )

    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toEqual([
      { field: 'pag', message: 'Parâmetro não permitido.' },
    ])
    const stored = await storedRecords(goal.id)
    expect(stored).toHaveLength(0)
  })

  it('documents the route in Swagger', () => {
    expect(app.swagger().paths).toHaveProperty('/goals/{id}/records')
  })
})
