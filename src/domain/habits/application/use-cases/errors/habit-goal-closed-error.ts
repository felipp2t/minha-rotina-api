import type { BaseError } from '../../../../../core/errors/base-error.js'

// R3: a closed goal keeps its history but accepts no new records, even late ones.
export class HabitGoalClosedError extends Error implements BaseError {
  constructor() {
    super('A meta está encerrada e não aceita novos registros.')
    this.name = 'HabitGoalClosedError'
  }
}
