import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { makeCreateParticipantUseCase } from '../factories/make-create-participant-use-case.js'
import { errorSchema, toErrorResponse } from '../schemas/error.schema.js'
import {
  createParticipantBodySchema,
  emptyQuerySchema,
  participantSchema,
  toParticipantDto,
} from '../schemas/participant.schema.js'

// Registers participant creation and translates expected duplicate-email errors.
export const createParticipantController: FastifyPluginCallbackZod = (
  app,
  _options,
  done,
) => {
  app.post(
    '/participants',
    {
      schema: {
        operationId: 'createParticipant',
        summary: 'Create participant',
        tags: ['participants'],
        body: createParticipantBodySchema,
        querystring: emptyQuerySchema,
        response: {
          201: participantSchema,
          400: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await makeCreateParticipantUseCase().execute(request.body)
      if (result.isLeft()) {
        return reply
          .status(400)
          .send(
            toErrorResponse(result.value.message, [
              { field: 'email', message: result.value.message },
            ]),
          )
      }
      return reply.status(201).send(toParticipantDto(result.value))
    },
  )
  done()
}
