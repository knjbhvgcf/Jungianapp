import { isFigure } from './circle'
import { readInviteSnapshot, registerInviteWait } from './inviteClient'
import type { ResultSnapshot, WorkspaceHouse, WorkspacePerson } from './types'

export const INVITE_WATCH_MS = 5000

export function pendingInvitePeople(house: WorkspaceHouse) {
  return house.people.filter((person) => !isFigure(person) && Boolean(person.inviteToken) && !person.code)
}

export function unseenPings(house: WorkspaceHouse) {
  return (house.pings ?? []).filter((ping) => !ping.seen)
}

export function latestUnseenPing(house: WorkspaceHouse) {
  return unseenPings(house)[0] ?? null
}

export function pingForPerson(house: WorkspaceHouse, personId: string) {
  return (house.pings ?? []).find((ping) => ping.personId === personId && !ping.seen) ?? null
}

function notifyEmail(value: string | undefined) {
  const email = String(value ?? '').trim().toLowerCase()
  return /^\S+@\S+\.\S+$/.test(email) ? email : ''
}

export function armInvitePing(token: string | undefined, name: string, email: string | undefined) {
  const notify = notifyEmail(email)
  if (!token || !notify) return
  void registerInviteWait(token, notify, name)
}

export function armPendingInvitePings(house: WorkspaceHouse) {
  const notify = notifyEmail(house.email)
  if (!notify) return
  for (const person of pendingInvitePeople(house)) {
    armInvitePing(person.inviteToken, person.name, notify)
  }
}

export async function pullInviteArrivals(people: WorkspacePerson[]) {
  const arrivals: { person: WorkspacePerson; snapshot: ResultSnapshot }[] = []
  for (const person of people) {
    if (!person.inviteToken) continue
    const result = await readInviteSnapshot(person.inviteToken)
    if (result.ok && result.snapshot) arrivals.push({ person, snapshot: result.snapshot })
  }
  return arrivals
}

export function askToPingThisDevice() {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return
    void Notification.requestPermission()
  } catch {
    /* native / denied */
  }
}

export function pingThisDevice(name: string, code: string) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    new Notification(`${name} sent ${code}`, { body: 'Open Library to Compare.' })
  } catch {
    /* ignore */
  }
}
