import type { BaseError } from '../../../../../core/errors/base-error.js'

// Signals that no participant exists for the requested UUID.
export class ParticipantNotFoundError extends Error implements BaseError {
  constructor() {
    super('Participante não encontrado.')
    this.name = 'ParticipantNotFoundError'
  }
}
