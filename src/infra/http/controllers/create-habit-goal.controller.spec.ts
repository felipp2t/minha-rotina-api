import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryParticipantRepository } from '../../../../test/repositories/in-memory-participant-repository.js'
import { buildApp } from '../../../app.js'
import { CreateHabitGoalUseCase } from '../../../domain/habits/application/use-cases/create-habit-goal.js'
import { Participant } from '../../../domain/habits/enterprise/entities/participant.js'

const { factory } = vi.hoisted(() => ({ factory: vi.fn() }))
vi.mock('../factories/make-create-habit-goal-use-case.js', () => ({
  makeCreateHabitGoalUseCase: factory,
}))
afterEach(() => vi.clearAllMocks())

async function setup() {
  const participants = new InMemoryParticipantRepository()
  const goals = new InMemoryHabitGoalRepository()
  const participant = Participant.create({
    name: 'Ana',
    email: 'ana@example.com',
  })
  await participants.create(participant)
  factory.mockReturnValue(new CreateHabitGoalUseCase(participants, goals))
  const app = buildApp()
  const body = {
    participantId: participant.id.toString(),
    name: ' Caminhar ',
    dailyTarget: 30,
    unit: 'MINUTES',
    startDate: '2099-01-01',
  }
  return { app, body, goals }
}

describe('Habit goal HTTP validation without a database', () => {
  it('creates the public DTO and translates duplicate and missing participant errors', async () => {
    const { app, body } = await setup()
    try {
      const first = await app.inject({
        method: 'POST',
        url: '/goals',
        payload: body,
      })
      expect(first.statusCode).toBe(201)
      expect(first.json()).toEqual({
        ...body,
        id: expect.any(String),
        name: 'Caminhar',
        closedAt: null,
      })
      const duplicate = await app.inject({
        method: 'POST',
        url: '/goals',
        payload: { ...body, name: ' CAMINHAR ' },
      })
      expect(duplicate.statusCode).toBe(400)
      const missing = await app.inject({
        method: 'POST',
        url: '/goals',
        payload: { ...body, participantId: randomUUID() },
      })
      expect(missing.statusCode).toBe(404)
      expect(missing.json()).toEqual({
        message: 'Participante não encontrado.',
        metadata: { fields: [] },
      })
    } finally {
      await app.close()
    }
  })
  it.each([
    ['participantId', 'invalid'],
    ['name', '  '],
    ['name', 'a'.repeat(101)],
    ['dailyTarget', 0],
    ['dailyTarget', -1],
    ['dailyTarget', 1.5],
    ['dailyTarget', '30'],
    ['dailyTarget', 2_147_483_648],
    ['unit', 'ml'],
    ['startDate', '2026-02-29'],
    ['startDate', '2026-04-31'],
    ['startDate', '2026-13-01'],
    ['startDate', '2026-1-01'],
    ['startDate', '2026-10-13T00:00:00Z'],
    ['startDate', '0000-01-01'],
  ])(
    'rejects invalid %s before executing the use case: %s',
    async (field, value) => {
      const { app, body } = await setup()
      try {
        const response = await app.inject({
          method: 'POST',
          url: '/goals',
          payload: { ...body, [field]: value },
        })
        expect(response.statusCode).toBe(400)
        expect(response.json().metadata.fields).toContainEqual({
          field,
          message: expect.any(String),
        })
        expect(factory).not.toHaveBeenCalled()
      } finally {
        await app.close()
      }
    },
  )
  it('rejects missing fields, unknown fields, query parameters and malformed JSON', async () => {
    const { app, body } = await setup()
    try {
      const missing = await app.inject({
        method: 'POST',
        url: '/goals',
        payload: {},
      })
      expect(missing.statusCode).toBe(400)
      expect(missing.json().metadata.fields).toHaveLength(5)
      const unknown = await app.inject({
        method: 'POST',
        url: '/goals',
        payload: { ...body, id: randomUUID(), normalizedName: 'foo' },
      })
      expect(unknown.statusCode).toBe(400)
      expect(
        unknown
          .json()
          .metadata.fields.map((item: { field: string }) => item.field)
          .sort(),
      ).toEqual(['id', 'normalizedName'])
      const query = await app.inject({
        method: 'POST',
        url: '/goals?extra=1',
        payload: body,
      })
      expect(query.statusCode).toBe(400)
      expect(query.json().metadata.fields).toEqual([
        { field: 'extra', message: 'Parâmetro não permitido.' },
      ])
      const malformed = await app.inject({
        method: 'POST',
        url: '/goals',
        headers: { 'content-type': 'application/json' },
        payload: '{',
      })
      expect(malformed.statusCode).toBe(400)
      expect(malformed.json()).toEqual({
        message: expect.any(String),
        metadata: { fields: [] },
      })
      expect(factory).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })
  it.each(['2000-01-01', '2026-10-13', '2099-01-01', '2024-02-29'])(
    'accepts valid dates: %s',
    async (startDate) => {
      const { app, body } = await setup()
      try {
        expect(
          (
            await app.inject({
              method: 'POST',
              url: '/goals',
              payload: { ...body, startDate },
            })
          ).statusCode,
        ).toBe(201)
      } finally {
        await app.close()
      }
    },
  )
})
