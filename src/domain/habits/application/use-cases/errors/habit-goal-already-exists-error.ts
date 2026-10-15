import type { BaseError } from '../../../../../core/errors/base-error.js'

export class HabitGoalAlreadyExistsError extends Error implements BaseError {
  constructor() {
    super(
      'Já existe uma meta não encerrada com esse nome e unidade para o participante.',
    )
    this.name = 'HabitGoalAlreadyExistsError'
  }
}
