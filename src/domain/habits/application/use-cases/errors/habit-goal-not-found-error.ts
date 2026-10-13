import type { BaseError } from '../../../../../core/errors/base-error.js'

// Signals that no habit goal exists for the requested UUID.
export class HabitGoalNotFoundError extends Error implements BaseError {
  constructor() {
    super('Meta não encontrada.')
    this.name = 'HabitGoalNotFoundError'
  }
}
