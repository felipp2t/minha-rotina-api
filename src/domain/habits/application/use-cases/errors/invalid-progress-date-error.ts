import type { BaseError } from '../../../../../core/errors/base-error.js'

export class InvalidProgressDateError extends Error implements BaseError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidProgressDateError'
  }
}
