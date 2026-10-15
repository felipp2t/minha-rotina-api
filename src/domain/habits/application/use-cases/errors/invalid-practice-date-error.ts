import type { BaseError } from '../../../../../core/errors/base-error.js'

export class InvalidPracticeDateError extends Error implements BaseError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPracticeDateError'
  }
}
