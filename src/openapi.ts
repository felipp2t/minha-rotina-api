import { writeFile } from 'node:fs/promises'
import { buildApp } from './app.js'

const app = buildApp()
try {
  await app.ready()
  await writeFile(
    new URL('../openapi.json', import.meta.url),
    `${JSON.stringify(app.swagger(), null, 2)}\n`,
  )
} finally {
  await app.close()
}
