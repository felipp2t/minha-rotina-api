import type { BaseError } from '../../../../../core/errors/base-error.js'

export class ParticipantAlreadyExistsError extends Error implements BaseError {
  constructor() {
    super('Já existe um participante com este e-mail.')
    this.name = 'ParticipantAlreadyExistsError'
  }
}
