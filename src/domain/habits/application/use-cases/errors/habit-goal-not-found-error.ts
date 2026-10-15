import type { BaseError } from '../../../../../core/errors/base-error.js'

export class HabitGoalNotFoundError extends Error implements BaseError {
  constructor() {
    super('Meta não encontrada.')
    this.name = 'HabitGoalNotFoundError'
  }
}
