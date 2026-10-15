import type { Participant } from '../../enterprise/entities/participant.js'

export interface ParticipantPage {
  participants: Participant[]
  total: number
}

export interface PaginationInput {
  page: number
  limit: number
}

export abstract class ParticipantRepository {
  abstract create(participant: Participant): Promise<boolean>
  abstract findByEmail(email: string): Promise<Participant | null>
  abstract findById(id: string): Promise<Participant | null>
  abstract findAll(input: PaginationInput): Promise<ParticipantPage>
}
