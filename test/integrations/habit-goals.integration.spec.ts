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
import { HabitGoal } from '../../src/domain/habits/enterprise/entities/habit-goal.js'
import { setDatabase } from '../../src/infra/db/database.js'
import { DrizzleHabitGoalRepository } from '../../src/infra/db/drizzle/repositories/habit-goal-repository.js'
import { habitGoals } from '../../src/infra/db/drizzle/schema/habit-goals.js'
import {
  type HabitGoalDto,
  toHabitGoalDto,
} from '../../src/infra/http/schemas/habit-goal.schema.js'
import { createTestDatabase } from '../infra/db/test-database.js'

const app = buildApp()
let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>
let participantId: string
let repository: DrizzleHabitGoalRepository
beforeAll(async () => {
  testDatabase = await createTestDatabase()
  setDatabase(testDatabase.database)
  repository = new DrizzleHabitGoalRepository(testDatabase.database)
  await app.ready()
})
beforeEach(async () => {
  vi.restoreAllMocks()
  await testDatabase.database.db.execute(sql`TRUNCATE participants CASCADE`)
  const response = await app.inject({
    method: 'POST',
    url: '/participants',
    payload: { name: 'Ana', email: 'ana@example.com' },
  })
  participantId = response.json<{ id: string }>().id
})
afterAll(async () => {
  vi.restoreAllMocks()
  await app.close()
  setDatabase(undefined)
  if (testDatabase) await testDatabase.close()
})
function payload() {
  return {
    participantId,
    name: ' Caminhar ',
    dailyTarget: 30,
    unit: 'MINUTES',
    startDate: '2026-10-09',
  }
}
function createGoal(overrides: Record<string, unknown> = {}, url = '/goals') {
  return app.inject({
    method: 'POST',
    url,
    payload: { ...payload(), ...overrides },
  })
}

describe('Habit goal creation HTTP API with PostgreSQL', () => {
  it('returns the exact public DTO and persists the internal normalized name', async () => {
    const response = await createGoal()
    expect(response.statusCode).toBe(201)
    const goal = response.json<HabitGoalDto>()
    expect(goal).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      participantId,
      name: 'Caminhar',
      dailyTarget: 30,
      unit: 'MINUTES',
      startDate: '2026-10-09',
      closedAt: null,
    })
    const [row] = await testDatabase.database.db
      .select()
      .from(habitGoals)
      .where(eq(habitGoals.id, goal.id))
    expect(row?.normalizedName).toBe('caminhar')
    const stored = await repository.findById(goal.id)
    expect(stored).toBeInstanceOf(HabitGoal)
    expect(stored && toHabitGoalDto(stored)).toEqual(goal)
    expect(await repository.findById(randomUUID())).toBeNull()
  })
  it.each([
    '2000-01-01',
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()),
    '2099-01-01',
    '2024-02-29',
  ])(
    'accepts valid start dates including past, present and future: %s',
    async (startDate) => {
      expect((await createGoal({ startDate })).statusCode).toBe(201)
    },
  )
  it.each([
    ['name', ''],
    ['name', '   '],
    ['name', 'a'.repeat(101)],
    ['name', 123],
    ['dailyTarget', 0],
    ['dailyTarget', -1],
    ['dailyTarget', 1.5],
    ['dailyTarget', '30'],
    ['dailyTarget', 2_147_483_648],
    ['unit', 'ml'],
    ['unit', 'INVALID'],
    ['participantId', 'invalid'],
    ['startDate', '2026-02-29'],
    ['startDate', '2026-04-31'],
    ['startDate', '2026-13-01'],
    ['startDate', '2026-1-01'],
    ['startDate', '2026-10-09T00:00:00Z'],
    ['startDate', '0000-01-01'],
  ])('rejects invalid %s: %s', async (field, value) => {
    const response = await createGoal({ [field]: value })
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toContainEqual({
      field,
      message: expect.any(String),
    })
    expect(
      await testDatabase.database.db.select().from(habitGoals),
    ).toHaveLength(0)
  })
  it.each(['participantId', 'name', 'dailyTarget', 'unit', 'startDate'])(
    'rejects missing %s',
    async (field) => {
      const body: Record<string, unknown> = payload()
      delete body[field]
      const response = await app.inject({
        method: 'POST',
        url: '/goals',
        payload: body,
      })
      expect(response.statusCode).toBe(400)
      expect(response.json().metadata.fields).toContainEqual({
        field,
        message: expect.any(String),
      })
    },
  )
  it.each(['ML', 'MINUTES', 'REPETITIONS'])(
    'accepts unit %s and boundary values',
    async (unit) => {
      const response = await createGoal({
        unit,
        name: ` ${'a'.repeat(100)} `,
        dailyTarget: 2_147_483_647,
      })
      expect(response.statusCode).toBe(201)
      expect(response.json().name).toHaveLength(100)
      expect(
        (await createGoal({ unit, name: 'Minimum', dailyTarget: 1 }))
          .statusCode,
      ).toBe(201)
    },
  )
  it('returns the 404 contract for a missing participant', async () => {
    const response = await createGoal({ participantId: randomUUID() })
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      message: 'Participante não encontrado.',
      metadata: { fields: [] },
    })
  })
  it('reports all unknown fields and query parameters', async () => {
    const body = await createGoal({
      id: randomUUID(),
      normalizedName: 'foo',
      extra: true,
    })
    expect(body.statusCode).toBe(400)
    expect(
      body
        .json()
        .metadata.fields.map((item: { field: string }) => item.field)
        .sort(),
    ).toEqual(['extra', 'id', 'normalizedName'])
    const query = await createGoal({}, '/goals?extra=1&limit=20')
    expect(query.statusCode).toBe(400)
    expect(query.json().metadata.fields).toEqual([
      { field: 'extra', message: 'Parâmetro não permitido.' },
      { field: 'limit', message: 'Parâmetro não permitido.' },
    ])
  })
  it('rejects normalized duplicate future goals but permits different units and participants', async () => {
    expect((await createGoal({ startDate: '2099-01-01' })).statusCode).toBe(201)
    const duplicate = await createGoal({ name: ' CAMINHAR ' })
    expect(duplicate.statusCode).toBe(400)
    expect(duplicate.json()).toEqual({
      message: expect.any(String),
      metadata: {
        fields: [
          { field: 'name', message: expect.any(String) },
          { field: 'unit', message: expect.any(String) },
        ],
      },
    })
    expect((await createGoal({ unit: 'REPETITIONS' })).statusCode).toBe(201)
    const other = await app.inject({
      method: 'POST',
      url: '/participants',
      payload: { name: 'Bia', email: 'bia@example.com' },
    })
    expect(
      (await createGoal({ participantId: other.json().id })).statusCode,
    ).toBe(201)
  })
  it('allows reuse after closure and maps closed goals for practice lookup', async () => {
    const first = (await createGoal()).json<HabitGoalDto>()
    await testDatabase.database.db
      .update(habitGoals)
      .set({ closedAt: '2026-10-10T15:00:00Z' })
      .where(eq(habitGoals.id, first.id))
    expect((await repository.findById(first.id))?.closedAt).not.toBeNull()
    expect((await createGoal()).statusCode).toBe(201)
    expect(
      await testDatabase.database.db.select().from(habitGoals),
    ).toHaveLength(2)
  })
  it('protects simultaneous requests with the PostgreSQL partial unique index', async () => {
    // Force every pre-check to miss, so the database must arbitrate the race.
    vi.spyOn(
      DrizzleHabitGoalRepository.prototype,
      'findActiveByParticipantNameAndUnit',
    ).mockResolvedValue(null)
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => createGoal({ startDate: '2099-01-01' })),
    )
    expect(responses.map((response) => response.statusCode).sort()).toEqual([
      201, 400, 400, 400, 400, 400,
    ])
    expect(
      await testDatabase.database.db.select().from(habitGoals),
    ).toHaveLength(1)
  })
  it('does not translate unrelated database failures into duplicates', async () => {
    vi.spyOn(DrizzleHabitGoalRepository.prototype, 'create').mockRejectedValue(
      new Error('private connection details'),
    )
    const response = await createGoal()
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      message: 'Erro interno do servidor.',
      metadata: { fields: [] },
    })
  })
  it('creates a goal that the existing practice record route can use', async () => {
    const created = await createGoal({ startDate: '2000-01-01' })
    expect(created.statusCode).toBe(201)
    const goal = created.json<HabitGoalDto>()
    const recorded = await app.inject({
      method: 'POST',
      url: `/goals/${goal.id}/records`,
      payload: { date: '2000-01-01', quantity: 15 },
    })
    expect(recorded.statusCode).toBe(201)
    expect(recorded.json()).toEqual({
      id: expect.any(String),
      goalId: goal.id,
      date: '2000-01-01',
      quantity: 15,
    })
    await testDatabase.database.db
      .update(habitGoals)
      .set({ closedAt: '2026-10-10T15:00:00Z' })
      .where(eq(habitGoals.id, goal.id))
    const closed = await app.inject({
      method: 'POST',
      url: `/goals/${goal.id}/records`,
      payload: { date: '2000-01-01', quantity: 15 },
    })
    expect(closed.statusCode).toBe(400)
    expect((await repository.findById(goal.id))?.isClosed).toBe(true)
  })
  it('documents creation and the public DTO in Swagger', () => {
    const paths = app.swagger().paths
    expect(paths).toHaveProperty('/goals')
    expect(paths?.['/goals']?.post?.responses).toHaveProperty('201')
    expect(paths?.['/goals']?.post?.responses).toHaveProperty('404')
    expect(JSON.stringify(paths?.['/goals'])).not.toContain('normalizedName')
  })
})
