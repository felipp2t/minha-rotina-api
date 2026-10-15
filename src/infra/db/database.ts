import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { schema } from './drizzle/schema/index.js'

export type Database = Awaited<ReturnType<typeof openDatabase>>

let activeDatabase: Database | undefined

export function setDatabase(database: Database | undefined) {
  activeDatabase = database
}

export function getDatabase(): Database {
  if (!activeDatabase) {
    throw new Error('Database has not been initialized')
  }
  return activeDatabase
}

export async function openDatabase(
  connectionString = process.env.DATABASE_URL,
) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }
  const pool = new Pool({ connectionString })
  const db = drizzle({ client: pool, schema })
  try {
    await migrate(db, { migrationsFolder: resolve('drizzle') })
  } catch (error) {
    await pool.end()
    throw error
  }
  return { db, close: () => pool.end() }
}
