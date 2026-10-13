import type { BaseError } from '../../../../../core/errors/base-error.js'

// Signals that no practice record exists for the requested UUID in this goal.
export class PracticeRecordNotFoundError extends Error implements BaseError {
  constructor() {
    super('Registro não encontrado.')
    this.name = 'PracticeRecordNotFoundError'
  }
}
