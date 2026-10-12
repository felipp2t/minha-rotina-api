import type { FastifyError, FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { toErrorResponse } from './schemas/error.schema.js'

function validationFields(error: FastifyError) {
  if (!hasZodFastifySchemaValidationErrors(error)) return []
  return error.validation.flatMap((issue) => {
    if (
      issue.keyword === 'unrecognized_keys' &&
      Array.isArray(issue.params.keys)
    ) {
      const message =
        error.validationContext === 'querystring'
          ? 'Parâmetro não permitido.'
          : 'Campo não permitido.'
      return issue.params.keys.map((key: string) => ({ field: key, message }))
    }
    return [
      {
        field: issue.instancePath.slice(1).replaceAll('/', '.'),
        message: issue.message ?? 'Valor inválido.',
      },
    ]
  })
}

// Centralizes request validation and unexpected errors in the public contract.
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply
        .status(400)
        .send(toErrorResponse('Campos inválidos.', validationFields(error)))
    }
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply
        .status(error.statusCode)
        .send(toErrorResponse('Requisição inválida.'))
    }
    request.log.error({ err: error }, 'Unexpected request error')
    return reply.status(500).send(toErrorResponse('Erro interno do servidor.'))
  })
  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send(toErrorResponse('Rota não encontrada.')),
  )
}
