import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
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
import { Participant } from '../../src/domain/habits/enterprise/entities/participant.js'
import { setDatabase } from '../../src/infra/db/database.js'
import { DrizzleParticipantRepository } from '../../src/infra/db/drizzle/repositories/participant-repository.js'
import { participants } from '../../src/infra/db/drizzle/schema/participants.js'
import {
  type ParticipantDto,
  toParticipantDto,
} from '../../src/infra/http/schemas/participant.schema.js'
import { createTestDatabase } from '../infra/db/test-database.js'

const app = buildApp()
let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>

beforeAll(async () => {
  testDatabase = await createTestDatabase()
  setDatabase(testDatabase.database)
  await app.ready()
})
beforeEach(async () => {
  vi.restoreAllMocks()
  await testDatabase.database.db.execute(sql`TRUNCATE participants CASCADE`)
})
afterAll(async () => {
  vi.restoreAllMocks()
  await app.close()
  setDatabase(undefined)
  if (testDatabase) await testDatabase.close()
})

function createParticipant(name = 'Ana Silva', email = 'ana@example.com') {
  return app.inject({
    method: 'POST',
    url: '/participants',
    payload: { name, email },
  })
}

describe('Participant HTTP API with PostgreSQL', () => {
  it('creates, persists and fetches a normalized participant', async () => {
    const response = await createParticipant(' Ana Silva ', ' ANA@EXAMPLE.COM ')
    expect(response.statusCode).toBe(201)
    const participant = response.json<ParticipantDto>()
    expect(participant).toEqual({
      id: expect.any(String),
      name: 'Ana Silva',
      email: 'ana@example.com',
    })
    expect(response.headers.location).toBeUndefined()
    const fetched = await app.inject({
      method: 'GET',
      url: `/participants/${participant.id}`,
    })
    expect(fetched.statusCode).toBe(200)
    expect(fetched.json()).toEqual(participant)
    const stored = await new DrizzleParticipantRepository(
      testDatabase.database,
    ).findById(participant.id)
    expect(stored).toBeInstanceOf(Participant)
    expect(stored && toParticipantDto(stored)).toEqual(participant)
  })
  it('rejects an email duplicate after normalization', async () => {
    await createParticipant()
    const response = await createParticipant('Outra', ' ANA@EXAMPLE.COM ')
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toEqual([
      { field: 'email', message: expect.any(String) },
    ])
    const list = await app.inject({ method: 'GET', url: '/participants' })
    expect(list.json().pagination.total).toBe(1)
  })
  it('permits exactly one of two concurrent duplicate registrations', async () => {
    const responses = await Promise.all([
      createParticipant(),
      createParticipant('Outra', ' ANA@EXAMPLE.COM '),
    ])
    expect(responses.map((response) => response.statusCode).sort()).toEqual([
      201, 400,
    ])
    const list = await app.inject({ method: 'GET', url: '/participants' })
    expect(list.json().pagination.total).toBe(1)
  })
  it.each([
    { name: '', email: 'ana@example.com', field: 'name' },
    { name: '   ', email: 'ana@example.com', field: 'name' },
    { name: 'a'.repeat(101), email: 'ana@example.com', field: 'name' },
    { name: 'Ana', email: 'invalid', field: 'email' },
    { name: 'Ana', email: '', field: 'email' },
  ])('rejects invalid input for $field', async ({ name, email, field }) => {
    const response = await createParticipant(name, email)
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields).toContainEqual({
      field,
      message: expect.any(String),
    })
  })
  it('accepts a name at the 100-character boundary', async () => {
    expect((await createParticipant('a'.repeat(100))).statusCode).toBe(201)
  })
  it('rejects missing fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/participants',
      payload: {},
    })
    expect(response.statusCode).toBe(400)
    expect(
      response
        .json()
        .metadata.fields.map((field: { field: string }) => field.field)
        .sort(),
    ).toEqual(['email', 'name'])
  })
  it('reports every unknown body field', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/participants',
      payload: {
        name: 'Ana',
        email: 'ana@example.com',
        id: randomUUID(),
        extra: true,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: 'Campos inválidos.',
      metadata: {
        fields: [
          { field: 'id', message: 'Campo não permitido.' },
          { field: 'extra', message: 'Campo não permitido.' },
        ],
      },
    })
  })
  it('rejects malformed JSON with the standard error contract', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/participants',
      headers: { 'content-type': 'application/json' },
      payload: '{',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: expect.any(String),
      metadata: { fields: [] },
    })
  })
  it('returns 400 for malformed UUID and 404 for a missing valid UUID', async () => {
    const invalid = await app.inject({
      method: 'GET',
      url: '/participants/invalid',
    })
    expect(invalid.statusCode).toBe(400)
    expect(invalid.json().metadata.fields).toContainEqual({
      field: 'id',
      message: expect.any(String),
    })
    const missing = await app.inject({
      method: 'GET',
      url: `/participants/${randomUUID()}`,
    })
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toEqual({
      message: 'Participante não encontrado.',
      metadata: { fields: [] },
    })
  })
  it('orders by name and UUID before paginating with complete totals', async () => {
    const rows = [
      {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'Zoe',
        email: 'zoe@example.com',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Ana',
        email: 'ana2@example.com',
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Ana',
        email: 'ana1@example.com',
      },
    ]
    await testDatabase.database.db.insert(participants).values(rows)
    const response = await app.inject({
      method: 'GET',
      url: '/participants?page=2&limit=1',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      data: [rows[1]],
      pagination: { page: 2, limit: 1, total: 3, totalPages: 3 },
    })
    const beyond = await app.inject({
      method: 'GET',
      url: '/participants?page=5&limit=2',
    })
    expect(beyond.json()).toEqual({
      data: [],
      pagination: { page: 5, limit: 2, total: 3, totalPages: 2 },
    })
  })
  it('returns default pagination with zero totalPages for an empty database', async () => {
    const response = await app.inject({ method: 'GET', url: '/participants' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  })
  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=abc',
    'page=9007199254740991&limit=100',
    'limit=0',
    'limit=101',
    'limit=1.5',
  ])('rejects invalid pagination: %s', async (query) => {
    const response = await app.inject({
      method: 'GET',
      url: `/participants?${query}`,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().metadata.fields.length).toBeGreaterThan(0)
  })
  it.each(['GET', 'POST'])(
    'rejects unknown query parameters for %s',
    async (method) => {
      const response = await app.inject({
        method,
        url: '/participants?pag=1',
        ...(method === 'POST'
          ? { payload: { name: 'Ana', email: 'ana@example.com' } }
          : {}),
      })
      expect(response.statusCode).toBe(400)
      expect(response.json().metadata.fields).toEqual([
        { field: 'pag', message: 'Parâmetro não permitido.' },
      ])
    },
  )
  it('rejects query parameters on participant lookup', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/participants/${randomUUID()}?extra=1`,
    })
    expect(response.statusCode).toBe(400)
  })
  it('hides unexpected database errors', async () => {
    vi.spyOn(
      DrizzleParticipantRepository.prototype,
      'findAll',
    ).mockRejectedValue(new Error('secret database connection'))
    const response = await app.inject({ method: 'GET', url: '/participants' })
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      message: 'Erro interno do servidor.',
      metadata: { fields: [] },
    })
  })
  it('serves Swagger UI and documents the implemented routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/' })
    expect(response.statusCode).toBe(200)
    expect(app.swagger().paths).toHaveProperty('/participants')
    expect(app.swagger().paths).toHaveProperty('/participants/{id}')
  })
  it('uses the error contract for unknown routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/missing' })
    expect(response.statusCode).toBe(404)
    expect(response.json().metadata.fields).toEqual([])
  })
  it('enforces normalized email and name constraints in PostgreSQL', async () => {
    await expect(
      testDatabase.database.db
        .insert(participants)
        .values({ id: randomUUID(), name: 'Ana', email: 'ANA@EXAMPLE.COM' }),
    ).rejects.toThrow()
    await expect(
      testDatabase.database.db
        .insert(participants)
        .values({ id: randomUUID(), name: ' ', email: 'ana@example.com' }),
    ).rejects.toThrow()
  })
  it('creates all planned tables and their foreign keys through migrations', async () => {
    const result = await testDatabase.database.db.execute<{ name: string }>(
      sql`SELECT tablename as name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    )
    expect(result.rows.map((row) => row.name)).toEqual([
      'habit_goals',
      'participants',
      'practice_records',
    ])
    await expect(
      testDatabase.database.db.execute(
        sql`INSERT INTO habit_goals (id, participant_id, name, normalized_name, daily_target, unit, start_date) VALUES (${randomUUID()}, ${randomUUID()}, 'Caminhar', 'caminhar', 30, 'MINUTES', '2026-10-12')`,
      ),
    ).rejects.toThrow()
  })
})
