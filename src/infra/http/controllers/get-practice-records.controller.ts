import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeGetPracticeRecordsUseCase } from '../factories/make-get-practice-records-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  goalIdParamsSchema,
  practiceRecordListQuerySchema,
  practiceRecordListSchema,
  toPracticeRecordDto,
} from '../schemas/practice-record.schema.js'

export const getPracticeRecordsController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    '/goals/:id/records',
    {
      schema: {
        operationId: 'listPracticeRecords',
        summary: 'List practice records of a goal',
        description:
          'Ordered by date and UUID. Closed goals keep their history available.',
        tags: ['records'],
        params: goalIdParamsSchema,
        querystring: practiceRecordListQuerySchema,
        response: {
          200: practiceRecordListSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeGetPracticeRecordsUseCase().execute({
        goalId: request.params.id,
        ...request.query,
      })
      if (result.isLeft()) {
        return reply.status(404).send(toErrorResponse(result.value.message))
      }
      return reply.status(200).send({
        data: result.value.records.map(toPracticeRecordDto),
        pagination: result.value.pagination,
      })
    },
  )
  done()
}
