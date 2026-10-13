import type { BaseError } from '../../../../../core/errors/base-error.js'

// R2: the practice date must be between the goal start date and today.
export class InvalidPracticeDateError extends Error implements BaseError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPracticeDateError'
  }
}
