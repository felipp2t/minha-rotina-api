import { z } from 'zod'
import { buildApp } from './app.js'
import { openDatabase, setDatabase } from './infra/db/database.js'

async function start() {
  const environment = z
    .object({
      PORT: z.coerce.number().int().min(1).max(65535).default(3333),
      HOST: z.string().default('127.0.0.1'),
    })
    .parse(process.env)
  const database = await openDatabase()
  setDatabase(database)
  const app = buildApp({ logger: true })
  app.addHook('onClose', async () => {
    await database.close()
    setDatabase(undefined)
  })
  try {
    await app.listen({ host: environment.HOST, port: environment.PORT })
  } catch (error) {
    await app.close()
    throw error
  }
  const shutdown = () => {
    app.close().catch((error: unknown) => {
      app.log.error(error)
      process.exitCode = 1
    })
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

start().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
