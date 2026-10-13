import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryHabitGoalRepository } from '../../../../../test/repositories/in-memory-habit-goal-repository.js'
import { InMemoryParticipantRepository } from '../../../../../test/repositories/in-memory-participant-repository.js'
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.js'
import { HabitGoal } from '../../enterprise/entities/habit-goal.js'
import { Participant } from '../../enterprise/entities/participant.js'
import {
  type CreateHabitGoalInput,
  CreateHabitGoalUseCase,
} from './create-habit-goal.js'
import { HabitGoalAlreadyExistsError } from './errors/habit-goal-already-exists-error.js'
import { ParticipantNotFoundError } from './errors/participant-not-found-error.js'

let goals: InMemoryHabitGoalRepository
let participants: InMemoryParticipantRepository
let useCase: CreateHabitGoalUseCase
let input: CreateHabitGoalInput

beforeEach(async () => {
  goals = new InMemoryHabitGoalRepository()

  participants = new InMemoryParticipantRepository()

  const participant = Participant.create({
    name: 'Ana',
    email: 'ana@example.com',
  })

  await participants.create(participant)

  useCase = new CreateHabitGoalUseCase(participants, goals)

  input = {
    participantId: participant.id.toString(),
    name: ' Caminhar ',
    dailyTarget: 30,
    unit: 'MINUTES',
    startDate: '2026-10-09',
  }
})

describe('Create habit goal', () => {
  it('creates a trimmed goal with a UUID, normalized name and fixed measurements', async () => {
    const result = await useCase.execute(input)

    expect(result.isRight()).toBe(true)
    expect(goals.items).toHaveLength(1)

    const goal = goals.items[0]

    expect(goal).toBeInstanceOf(HabitGoal)
    expect(goal?.id.toString()).toMatch(/^[0-9a-f-]{36}$/)
    expect(goal?.participantId.toString()).toBe(input.participantId)
    expect(goal?.name).toBe('Caminhar')
    expect(goal?.normalizedName).toBe('caminhar')
    expect(goal?.dailyTarget).toBe(30)
    expect(goal?.unit).toBe('MINUTES')
    expect(goal?.startDate).toBe(input.startDate)
    expect(goal?.closedAt).toBeNull()
  })

  it('rejects an unknown participant without persisting', async () => {
    const result = await useCase.execute({
      ...input,
      participantId: new UniqueEntityID().toString(),
    })

    expect(result.value).toBeInstanceOf(ParticipantNotFoundError)
    expect(goals.items).toHaveLength(0)
  })

  it('rejects normalized duplicates including future starts', async () => {
    await useCase.execute({ ...input, startDate: '2099-01-01' })

    const result = await useCase.execute({ ...input, name: ' CAMINHAR ' })

    expect(result.value).toBeInstanceOf(HabitGoalAlreadyExistsError)
    expect(goals.items).toHaveLength(1)
  })

  it('allows different units and different participants', async () => {
    await useCase.execute(input)

    const differentUnit = await useCase.execute({
      ...input,
      unit: 'REPETITIONS',
    })

    expect(differentUnit.isRight()).toBe(true)

    const other = Participant.create({ name: 'Bia', email: 'bia@example.com' })
    await participants.create(other)

    const differentParticipant = await useCase.execute({
      ...input,
      participantId: other.id.toString(),
    })

    expect(differentParticipant.isRight()).toBe(true)
    expect(goals.items).toHaveLength(3)
  })

  it('allows reuse of the name and unit after closure', async () => {
    goals.items.push(
      HabitGoal.create({
        ...input,
        participantId: new UniqueEntityID(input.participantId),
        closedAt: new Date('2026-10-10T15:00:00Z'),
      }),
    )

    const result = await useCase.execute(input)

    expect(result.isRight()).toBe(true)
    expect(goals.items).toHaveLength(2)
  })

  it('translates a duplicate reported by persistence', async () => {
    vi.spyOn(goals, 'create').mockResolvedValue(false)

    const result = await useCase.execute(input)

    expect(result.value).toBeInstanceOf(HabitGoalAlreadyExistsError)
  })
})
