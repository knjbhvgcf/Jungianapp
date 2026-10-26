import type { WorkspaceCircle, WorkspacePerson } from './types'

export type { WorkspaceCircle }

const TEAM_HINT =
  /\b(work|boss|colleag|co-?worker|team|client|manager|staff|employee|hire|office)\b/i

export function guessCircle(relation: string): WorkspaceCircle {
  return TEAM_HINT.test(relation) ? 'team' : 'household'
}

export function personCircle(person: WorkspacePerson): WorkspaceCircle {
  return person.circle ?? guessCircle(person.relation)
}

export function circleTitle(circle: WorkspaceCircle) {
  return circle === 'team' ? 'Team' : 'Household'
}
