import type { BaseError } from '../../../../../core/errors/base-error.js'

export class HabitGoalClosedError extends Error implements BaseError {
  constructor() {
    super('A meta está encerrada e não aceita novos registros.')
    this.name = 'HabitGoalClosedError'
  }
}
