import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { HabitGoalNotFoundError } from '../../../domain/habits/application/use-cases/errors/habit-goal-not-found-error.js'
import { makeCreatePracticeRecordUseCase } from '../factories/make-create-practice-record-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import { emptyQuerySchema } from '../schemas/participant.schema.js'
import {
  createPracticeRecordBodySchema,
  goalIdParamsSchema,
  practiceRecordSchema,
  toPracticeRecordDto,
} from '../schemas/practice-record.schema.js'

// Registers practice creation; missing goals map to 404 and R2/R3 violations to 400.
export const createPracticeRecordController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.post(
    '/goals/:id/records',
    {
      schema: {
        operationId: 'createPracticeRecord',
        summary: 'Register practice',
        description:
          'Accepts dates from the goal start date to today (America/Sao_Paulo), inclusive. Closed goals accept no new records. Several records on the same date and totals above the daily target are allowed.',
        tags: ['records'],
        params: goalIdParamsSchema,
        body: createPracticeRecordBodySchema,
        querystring: emptyQuerySchema,
        response: {
          201: practiceRecordSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeCreatePracticeRecordUseCase().execute({
        goalId: request.params.id,
        ...request.body,
      })
      if (result.isLeft()) {
        const status =
          result.value instanceof HabitGoalNotFoundError ? 404 : 400
        return reply.status(status).send(toErrorResponse(result.value.message))
      }
      return reply.status(201).send(toPracticeRecordDto(result.value))
    },
  )
  done()
}
