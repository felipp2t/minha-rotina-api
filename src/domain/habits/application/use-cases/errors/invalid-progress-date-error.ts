import type { BaseError } from '../../../../../core/errors/base-error.js'

// The progress date must be between the goal start date and today.
export class InvalidProgressDateError extends Error implements BaseError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidProgressDateError'
  }
}
