import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { HabitGoalNotFoundError } from '../../../domain/habits/application/use-cases/errors/habit-goal-not-found-error.js'
import { makeGetDailyProgressUseCase } from '../factories/make-get-daily-progress-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  dailyProgressQuerySchema,
  dailyProgressSchema,
  goalIdParamsSchema,
} from '../schemas/practice-record.schema.js'

export const getDailyProgressController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    '/goals/:id/progress',
    {
      schema: {
        operationId: 'getDailyProgress',
        summary: 'Get daily progress of a goal',
        description:
          'Sums every record of the goal on the date. Accepts dates from the goal start date to today (America/Sao_Paulo), including closed goals.',
        tags: ['progress'],
        params: goalIdParamsSchema,
        querystring: dailyProgressQuerySchema,
        response: {
          200: dailyProgressSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeGetDailyProgressUseCase().execute({
        goalId: request.params.id,
        date: request.query.date,
      })
      if (result.isLeft()) {
        const status =
          result.value instanceof HabitGoalNotFoundError ? 404 : 400
        return reply.status(status).send(toErrorResponse(result.value.message))
      }
      return reply.status(200).send(result.value)
    },
  )
  done()
}
