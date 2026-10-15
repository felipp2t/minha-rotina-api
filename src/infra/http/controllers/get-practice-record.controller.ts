import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeGetPracticeRecordUseCase } from '../factories/make-get-practice-record-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import { emptyQuerySchema } from '../schemas/participant.schema.js'
import {
  practiceRecordParamsSchema,
  practiceRecordSchema,
  toPracticeRecordDto,
} from '../schemas/practice-record.schema.js'

export const getPracticeRecordController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    '/goals/:goalId/records/:id',
    {
      schema: {
        operationId: 'getPracticeRecord',
        summary: 'Get a practice record of a goal',
        tags: ['records'],
        params: practiceRecordParamsSchema,
        querystring: emptyQuerySchema,
        response: {
          200: practiceRecordSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeGetPracticeRecordUseCase().execute(
        request.params,
      )
      if (result.isLeft()) {
        return reply.status(404).send(toErrorResponse(result.value.message))
      }
      return reply.status(200).send(toPracticeRecordDto(result.value))
    },
  )
  done()
}
