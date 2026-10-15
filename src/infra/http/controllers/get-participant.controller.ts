import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeGetParticipantUseCase } from '../factories/make-get-participant-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  emptyQuerySchema,
  participantIdParamsSchema,
  participantSchema,
  toParticipantDto,
} from '../schemas/participant.schema.js'

export const getParticipantController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    '/participants/:id',
    {
      schema: {
        operationId: 'getParticipant',
        summary: 'Get participant',
        tags: ['participants'],
        params: participantIdParamsSchema,
        querystring: emptyQuerySchema,
        response: {
          200: participantSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeGetParticipantUseCase().execute(
        request.params.id,
      )
      if (result.isLeft()) {
        return reply.status(404).send(toErrorResponse(result.value.message))
      }
      return reply.status(200).send(toParticipantDto(result.value))
    },
  )
  done()
}
