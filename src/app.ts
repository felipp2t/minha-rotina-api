import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createParticipantController } from './infra/http/controllers/create-participant.controller.js'
import { createPracticeRecordController } from './infra/http/controllers/create-practice-record.controller.js'
import { getParticipantController } from './infra/http/controllers/get-participant.controller.js'
import { getParticipantsController } from './infra/http/controllers/get-participants.controller.js'
import { getPracticeRecordController } from './infra/http/controllers/get-practice-record.controller.js'
import { getPracticeRecordsController } from './infra/http/controllers/get-practice-records.controller.js'
import { registerErrorHandler } from './infra/http/error-handler.js'

// Builds the HTTP application without opening a database or a listening socket.
export function buildApp({ logger = false }: { logger?: boolean } = {}) {
  const app = fastify({ logger }).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  registerErrorHandler(app)
  app.register(swagger, {
    openapi: { info: { title: 'Minha Rotina API', version: '0.1.0' } },
    transform: jsonSchemaTransform,
  })
  app.register(swaggerUi, { routePrefix: '/docs' })
  app.register(createParticipantController)
  app.register(getParticipantsController)
  app.register(getParticipantController)
  app.register(createPracticeRecordController)
  app.register(getPracticeRecordsController)
  app.register(getPracticeRecordController)
  return app
}
