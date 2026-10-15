import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeGetParticipantsUseCase } from '../factories/make-get-participants-use-case.js'
import { errorSchema } from '../schemas/error.schema.js'
import {
  participantListQuerySchema,
  participantListSchema,
  toParticipantDto,
} from '../schemas/participant.schema.js'

export const getParticipantsController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.get(
    '/participants',
    {
      schema: {
        operationId: 'listParticipants',
        summary: 'List participants',
        tags: ['participants'],
        querystring: participantListQuerySchema,
        response: {
          200: participantListSchema,
          400: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeGetParticipantsUseCase().execute(request.query)
      return reply.status(200).send({
        data: result.participants.map(toParticipantDto),
        pagination: result.pagination,
      })
    },
  )
  done()
}
