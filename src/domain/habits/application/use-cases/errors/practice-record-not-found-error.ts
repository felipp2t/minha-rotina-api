import type { BaseError } from '../../../../../core/errors/base-error.js'

export class PracticeRecordNotFoundError extends Error implements BaseError {
  constructor() {
    super('Registro não encontrado.')
    this.name = 'PracticeRecordNotFoundError'
  }
}
