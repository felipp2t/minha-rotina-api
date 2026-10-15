import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeCloseHabitGoalUseCase } from '../factories/make-close-habit-goal-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  habitGoalIdParamsSchema,
  habitGoalSchema,
  toHabitGoalDto,
} from '../schemas/habit-goal.schema.js'
import { emptyQuerySchema } from '../schemas/participant.schema.js'

export const closeHabitGoalController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.post(
    '/goals/:id/closure',
    {
      schema: {
        operationId: 'closeHabitGoal',
        summary: 'Close habit goal preserving history',
        description:
          'The server determines closedAt. Repeated closures return the first timestamp. The original target, unit and practice history are preserved.',
        tags: ['goals'],
        params: habitGoalIdParamsSchema,
        querystring: emptyQuerySchema,
        response: {
          200: habitGoalSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeCloseHabitGoalUseCase().execute(
        request.params.id,
      )
      if (result.isLeft()) {
        return reply.status(404).send(toErrorResponse(result.value.message))
      }
      return reply.status(200).send(toHabitGoalDto(result.value))
    },
  )
  done()
}
