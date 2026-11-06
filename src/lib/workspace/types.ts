import type { FunctionId } from '../../data/functions'

export type WorkspaceSource = 'quiz' | 'named' | 'invite'
export type WorkspaceCircle = string

export type WorkspaceGroup = {
  id: string
  name: string
}

export type ResultSnapshot = {
  code: string
  title: string
  stack: [FunctionId, FunctionId, FunctionId, FunctionId]
  percents: Partial<Record<FunctionId, number>>
}

export type WorkspacePerson = {
  id: string
  name: string
  relation: string
  source: WorkspaceSource
  code?: string
  percents?: Partial<Record<FunctionId, number>>
  trigger: string
  comfort: string
  inviteToken?: string
  circle?: WorkspaceCircle
}

export type HourWeather = 'ordinary' | 'loop' | 'grip'

export type HourSpan = 'minutes' | 'hour' | 'day'

export type HourTag = {
  id: string
  at: string
  weather: HourWeather
  note: string
  code?: string
  hint?: string
  span?: HourSpan
}

export type WorkspaceAuth = 'local' | 'email' | 'google'
export type WorkspacePlan = 'none' | 'active' | 'canceled'

export type WorkspaceAccountPatch = {
  email?: string
  auth?: WorkspaceAuth
  plan?: WorkspacePlan
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  planUpdatedAt?: string
}

export type FirstWeek = {
  skipped?: boolean
  done?: boolean
  personId?: string
}

export type InvitePing = {
  id: string
  personId: string
  name: string
  code: string
  at: string
  seen?: boolean
}

export type WorkspaceHouse = {
  email: string
  auth?: WorkspaceAuth
  createdAt: string
  plan?: WorkspacePlan
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  appleOriginalTransactionId?: string
  planUpdatedAt?: string
  self: ResultSnapshot | null
  people: WorkspacePerson[]
  hours: HourTag[]
  firstWeek?: FirstWeek
  pings?: InvitePing[]
  groups?: WorkspaceGroup[]
}
