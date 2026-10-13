import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeGetParticipantGoalsUseCase } from '../factories/make-get-participant-goals-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  habitGoalListQuerySchema,
  habitGoalListSchema,
  toHabitGoalDto,
} from '../schemas/habit-goal.schema.js'
import { participantIdParamsSchema } from '../schemas/participant.schema.js'

export const getParticipantGoalsController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    '/participants/:id/goals',
    {
      schema: {
        operationId: 'listParticipantGoals',
        summary: 'List participant goals',
        tags: ['goals'],
        params: participantIdParamsSchema,
        querystring: habitGoalListQuerySchema,
        response: {
          200: habitGoalListSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeGetParticipantGoalsUseCase().execute(
        request.params.id,
        request.query,
      )
      if (result.isLeft())
        return reply.status(404).send(toErrorResponse(result.value.message))
      return reply.status(200).send({
        data: result.value.goals.map(toHabitGoalDto),
        pagination: result.value.pagination,
      })
    },
  )
  done()
}
