import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { ParticipantNotFoundError } from '../../../domain/habits/application/use-cases/errors/participant-not-found-error.js'
import { makeCreateHabitGoalUseCase } from '../factories/make-create-habit-goal-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  createHabitGoalBodySchema,
  habitGoalSchema,
  toHabitGoalDto,
} from '../schemas/habit-goal.schema.js'
import { emptyQuerySchema } from '../schemas/participant.schema.js'

export const createHabitGoalController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.post(
    '/goals',
    {
      schema: {
        operationId: 'createHabitGoal',
        summary: 'Create habit goal',
        tags: ['goals'],
        body: createHabitGoalBodySchema,
        querystring: emptyQuerySchema,
        response: {
          201: habitGoalSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeCreateHabitGoalUseCase().execute(request.body)
      if (result.isLeft()) {
        if (result.value instanceof ParticipantNotFoundError) {
          return reply.status(404).send(toErrorResponse(result.value.message))
        }
        return reply.status(400).send(
          toErrorResponse(result.value.message, [
            { field: 'name', message: result.value.message },
            { field: 'unit', message: result.value.message },
          ]),
        )
      }
      return reply.status(201).send(toHabitGoalDto(result.value))
    },
  )
  done()
}
