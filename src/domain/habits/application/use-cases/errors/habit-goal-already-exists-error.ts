import type { BaseError } from '../../../../../core/errors/base-error.js'

// Signals that the participant already has an open goal with this name and unit.
export class HabitGoalAlreadyExistsError extends Error implements BaseError {
  constructor() {
    super(
      'Já existe uma meta não encerrada com esse nome e unidade para o participante.',
    )
    this.name = 'HabitGoalAlreadyExistsError'
  }
}
