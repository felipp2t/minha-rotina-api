import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { openDatabase } from '../../../src/infra/db/database.js'

// Creates an isolated temporary database; never truncates the configured database.
export async function createTestDatabase() {
  const connectionString =
    process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
  if (!connectionString)
    throw new Error(
      'TEST_DATABASE_URL or DATABASE_URL is required for integration tests',
    )
  const admin = new Pool({ connectionString })
  const name = `minha_rotina_test_${randomUUID().replaceAll('-', '')}`
  try {
    await admin.query(`CREATE DATABASE "${name}"`)
  } catch (error) {
    await admin.end()
    throw error
  }
  const url = new URL(connectionString)
  url.pathname = `/${name}`
  try {
    const database = await openDatabase(url.toString())
    return {
      database,
      async close() {
        try {
          await database.close()
          await admin.query(`DROP DATABASE "${name}"`)
        } finally {
          await admin.end()
        }
      },
    }
  } catch (error) {
    try {
      await admin.query(`DROP DATABASE "${name}"`)
    } finally {
      await admin.end()
    }
    throw error
  }
}
