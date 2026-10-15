import type { BaseError } from '../../../../../core/errors/base-error.js'

export class ParticipantNotFoundError extends Error implements BaseError {
  constructor() {
    super('Participante não encontrado.')
    this.name = 'ParticipantNotFoundError'
  }
}
