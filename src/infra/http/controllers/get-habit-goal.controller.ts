import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeGetHabitGoalUseCase } from '../factories/make-get-habit-goal-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  habitGoalIdParamsSchema,
  habitGoalSchema,
  toHabitGoalDto,
} from '../schemas/habit-goal.schema.js'
import { emptyQuerySchema } from '../schemas/participant.schema.js'

// Registers UUID lookup and maps the domain's not-found error to HTTP 404.
export const getHabitGoalController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    '/goals/:id',
    {
      schema: {
        operationId: 'getHabitGoal',
        summary: 'Get habit goal',
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
      const result = await makeGetHabitGoalUseCase().execute(request.params.id)
      if (result.isLeft()) {
        return reply.status(404).send(toErrorResponse(result.value.message))
      }
      return reply.status(200).send(toHabitGoalDto(result.value))
    },
  )
  done()
}
