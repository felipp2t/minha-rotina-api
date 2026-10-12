import type {
  PaginationInput,
  ParticipantRepository,
} from '../../src/domain/habits/application/repositories/participant-repository.js'
import type { Participant } from '../../src/domain/habits/enterprise/entities/participant.js'

// Provides participant persistence for unit tests without PostgreSQL.
export class InMemoryParticipantRepository implements ParticipantRepository {
  items: Participant[] = []

  create(participant: Participant): Promise<boolean> {
    if (this.items.some((item) => item.email === participant.email))
      return Promise.resolve(false)
    this.items.push(participant)
    return Promise.resolve(true)
  }
  findByEmail(email: string): Promise<Participant | null> {
    return Promise.resolve(
      this.items.find((item) => item.email === email) ?? null,
    )
  }
  findById(id: string): Promise<Participant | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null)
  }
  findAll({ page, limit }: PaginationInput) {
    const ordered = [...this.items].sort(
      (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    )
    return Promise.resolve({
      participants: ordered.slice((page - 1) * limit, page * limit),
      total: ordered.length,
    })
  }
}
