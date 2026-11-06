import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { isFiguresId, placeInGroup, resolveGroup, withGroup } from '../../src/lib/workspace/circle'
import { snapshotFromType } from '../../src/lib/workspace/fromType'
import { newInviteToken } from '../../src/lib/workspace/invitePacket'
import type {
  HourSpan,
  HourTag,
  HourWeather,
  InvitePing,
  ResultSnapshot,
  WorkspaceHouse,
  WorkspacePerson,
} from '../../src/lib/workspace/types'
import { weatherHint } from '../../src/lib/workspace/weather'

const KEY = 'jung-functions.workspace.house.v1'

type Listener = (house: WorkspaceHouse) => void

const listeners = new Set<Listener>()
let cached: WorkspaceHouse | null = null
let ready: Promise<WorkspaceHouse> | null = null

function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function emptyHouse(): WorkspaceHouse {
  return {
    email: '',
    auth: 'local',
    createdAt: new Date().toISOString(),
    plan: Platform.OS === 'ios' ? 'none' : 'active',
    self: null,
    people: [],
    hours: [],
  }
}

function asHouse(value: unknown): WorkspaceHouse | null {
  if (!value || typeof value !== 'object') return null
  const house = value as WorkspaceHouse
  if (!Array.isArray(house.people) || !Array.isArray(house.hours)) return null
  return house
}

function emit(house: WorkspaceHouse) {
  cached = house
  for (const listener of listeners) listener(house)
}

async function persist(house: WorkspaceHouse) {
  emit(house)
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(house))
  } catch {
    /* private mode / full disk */
  }
  return house
}

export async function loadHouse(): Promise<WorkspaceHouse> {
  if (cached) return cached
  if (ready) return ready
  ready = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY)
      const parsed = raw ? asHouse(JSON.parse(raw)) : null
      const house = parsed ?? emptyHouse()
      cached = house
      if (!parsed) await AsyncStorage.setItem(KEY, JSON.stringify(house))
      return house
    } catch {
      const house = emptyHouse()
      cached = house
      return house
    } finally {
      ready = null
    }
  })()
  return ready
}

export function subscribeHouse(listener: Listener) {
  listeners.add(listener)
  if (cached) listener(cached)
  else void loadHouse().then(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useHouse() {
  const [house, setHouse] = useState<WorkspaceHouse | null>(cached)
  useEffect(() => subscribeHouse(setHouse), [])
  return house
}

export async function applyStorePlan(entitlement: {
  active: boolean
  originalTransactionId?: string
}) {
  const house = await loadHouse()
  return persist({
    ...house,
    plan: entitlement.active ? 'active' : 'none',
    planUpdatedAt: new Date().toISOString(),
    appleOriginalTransactionId: entitlement.originalTransactionId ?? house.appleOriginalTransactionId,
  })
}

export async function saveSelfSnapshot(snapshot: ResultSnapshot | null) {
  const house = await loadHouse()
  const typeChanged = snapshot != null && house.self?.code !== snapshot.code
  const hours = typeChanged
    ? house.hours.map((tag) => ({
        ...tag,
        code: snapshot.code,
        hint: weatherHint(snapshot.stack, tag.weather),
      }))
    : house.hours
  return persist({ ...house, self: snapshot, hours })
}

export async function pullQuizPercents(snapshot: ResultSnapshot | null) {
  if (!snapshot) return loadHouse()
  const house = await loadHouse()
  if (!house.self) return house
  if (JSON.stringify(house.self.percents ?? {}) === JSON.stringify(snapshot.percents ?? {})) {
    return house
  }
  return saveSelfSnapshot({ ...house.self, percents: snapshot.percents })
}

export async function keepQuizSnapshot(snapshot: ResultSnapshot) {
  const house = await loadHouse()
  if (house.self) {
    return saveSelfSnapshot({
      ...snapshot,
      percents: snapshot.percents,
    })
  }
  return saveSelfSnapshot(snapshot)
}

export async function nameType(code: string) {
  const house = await loadHouse()
  const next = snapshotFromType(code, house.self)
  if (!next) return house
  return saveSelfSnapshot(next)
}

export async function skipFirstWeek() {
  const house = await loadHouse()
  return persist({ ...house, firstWeek: { ...house.firstWeek, skipped: true } })
}

export async function finishFirstWeek() {
  const house = await loadHouse()
  return persist({ ...house, firstWeek: { ...house.firstWeek, done: true } })
}

export async function keepGroup(name: string) {
  const house = await loadHouse()
  const group = resolveGroup(house, name)
  if (!group) return { house, group: null }
  return { house: await persist(withGroup(house, group)), group }
}

export async function renameGroup(id: string, name: string) {
  const house = await loadHouse()
  const trimmed = name.trim()
  if (!trimmed || isFiguresId(id) || isFiguresId(trimmed)) return house
  const current = withGroup(house, resolveGroup(house, id) ?? { id, name: trimmed })
  return persist({
    ...current,
    groups: (current.groups ?? []).map((group) => (group.id === id ? { ...group, name: trimmed } : group)),
  })
}

export async function addFirstWeekPerson(person: Omit<WorkspacePerson, 'id'>) {
  const house = await loadHouse()
  const placed = placeInGroup(house, person.circle)
  const next: WorkspacePerson = {
    ...person,
    id: uid(),
    inviteToken: person.inviteToken || newInviteToken(),
    circle: placed.circle,
  }
  return persist({
    ...placed.house,
    people: [...placed.house.people, next],
    firstWeek: { ...placed.house.firstWeek, personId: next.id, skipped: false, done: false },
  })
}

export async function addPerson(person: Omit<WorkspacePerson, 'id'>) {
  const house = await loadHouse()
  const placed = placeInGroup(house, person.circle)
  const next: WorkspacePerson = {
    ...person,
    id: uid(),
    inviteToken: isFiguresId(placed.circle) ? person.inviteToken : person.inviteToken || newInviteToken(),
    circle: placed.circle,
  }
  return persist({ ...placed.house, people: [...placed.house.people, next] })
}

export async function updatePerson(id: string, patch: Partial<WorkspacePerson>) {
  const house = await loadHouse()
  const placed = patch.circle !== undefined ? placeInGroup(house, patch.circle) : { house, circle: patch.circle }
  return persist({
    ...placed.house,
    people: placed.house.people.map((person) =>
      person.id === id ? { ...person, ...patch, circle: placed.circle ?? patch.circle ?? person.circle } : person,
    ),
  })
}

export async function applyPersonSnapshot(id: string, snapshot: ResultSnapshot) {
  return updatePerson(id, {
    code: snapshot.code,
    percents: snapshot.percents,
    source: 'quiz',
  })
}

export async function keepInviteArrival(personId: string, snapshot: ResultSnapshot) {
  const house = await loadHouse()
  const person = house.people.find((item) => item.id === personId)
  if (!person) return house
  const same =
    person.code === snapshot.code &&
    JSON.stringify(person.percents ?? {}) === JSON.stringify(snapshot.percents ?? {})
  const people = house.people.map((item) =>
    item.id === personId
      ? { ...item, code: snapshot.code, percents: snapshot.percents, source: 'quiz' as const }
      : item,
  )
  const already = (house.pings ?? []).some(
    (ping) => ping.personId === personId && ping.code === snapshot.code && !ping.seen,
  )
  const ping: InvitePing = {
    id: uid(),
    personId,
    name: person.name,
    code: snapshot.code,
    at: new Date().toISOString(),
  }
  const pings = already ? house.pings : [ping, ...(house.pings ?? [])].slice(0, 8)
  if (same && already) return house
  return persist({ ...house, people, pings })
}

export async function dismissPing(id: string) {
  const house = await loadHouse()
  return persist({
    ...house,
    pings: (house.pings ?? []).map((ping) => (ping.id === id ? { ...ping, seen: true } : ping)),
  })
}

export async function removePerson(id: string) {
  const house = await loadHouse()
  return persist({ ...house, people: house.people.filter((person) => person.id !== id) })
}

export async function addHour(
  weather: HourWeather,
  note: string,
  self: ResultSnapshot | null = null,
  span: HourSpan = 'hour',
) {
  const house = await loadHouse()
  const tag: HourTag = {
    id: uid(),
    at: new Date().toISOString(),
    weather,
    note,
    code: self?.code,
    hint: self ? weatherHint(self.stack, weather) : undefined,
    span,
  }
  return persist({ ...house, hours: [tag, ...house.hours] })
}
