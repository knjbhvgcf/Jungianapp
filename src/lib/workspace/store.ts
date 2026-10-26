import { useSyncExternalStore } from 'react'
import { fetchWorkspaceHouse, logoutWorkspace, putWorkspaceHouse } from './accountClient'
import { loadResultSnapshot } from './snapshot'
import type {
  HourSpan,
  HourTag,
  HourWeather,
  ResultSnapshot,
  WorkspaceAccountPatch,
  WorkspaceHouse,
  WorkspacePerson,
} from './types'
import { weatherHint } from './weather'

const KEY = 'jung-functions.workspace.house.v1'
const KEEP_SKIP_KEY = 'jung-functions.workspace.keep.skip.v1'

type Listener = () => void
export type AccountStatus = 'unknown' | 'in' | 'out'

const listeners = new Set<Listener>()
let cachedRaw: string | null | undefined
let cachedHouse: WorkspaceHouse | null = null
let sessionStatus: AccountStatus = 'unknown'
let applyingRemote = false
let hydratePromise: Promise<void> | null = null
let pushTimer: ReturnType<typeof setTimeout> | undefined

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function emit() {
  for (const listener of listeners) listener()
}

function asHouse(value: unknown): WorkspaceHouse | null {
  if (!value || typeof value !== 'object') return null
  const house = value as WorkspaceHouse
  if (typeof house.email !== 'string' || !Array.isArray(house.people) || !Array.isArray(house.hours)) {
    return null
  }
  return house
}

function houseHasLife(house: WorkspaceHouse) {
  return Boolean(house.self) || house.people.length > 0 || house.hours.length > 0
}

function mergeLocalIfServerEmpty(server: WorkspaceHouse, local: WorkspaceHouse | null) {
  if (!local || houseHasLife(server) || !houseHasLife(local)) return server
  return {
    ...local,
    email: server.email,
    auth: 'email' as const,
    plan: server.plan ?? 'none',
    stripeCustomerId: server.stripeCustomerId,
    stripeSubscriptionId: server.stripeSubscriptionId,
    planUpdatedAt: server.planUpdatedAt,
    createdAt: local.createdAt || server.createdAt,
  }
}

export function loadHouse(): WorkspaceHouse | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === cachedRaw) return cachedHouse
    cachedRaw = raw
    if (!raw) {
      cachedHouse = null
      return null
    }
    const parsed = asHouse(JSON.parse(raw))
    cachedHouse = parsed
    return parsed
  } catch {
    cachedHouse = null
    return null
  }
}

function currentHouse(): WorkspaceHouse | null {
  return sessionStatus === 'in' ? loadHouse() : null
}

function schedulePush(house: WorkspaceHouse) {
  if (sessionStatus !== 'in' || typeof window === 'undefined') return
  if (house.plan !== 'active') return
  window.clearTimeout(pushTimer)
  pushTimer = window.setTimeout(() => {
    void putWorkspaceHouse(house)
      .then((saved) => applyRemoteHouse(saved))
      .catch(() => undefined)
  }, 400)
}

export function applyRemoteHouse(house: WorkspaceHouse) {
  if (sessionStatus !== 'in') return house
  applyingRemote = true
  const next = writeHouse(house)
  applyingRemote = false
  return next
}

function writeHouse(house: WorkspaceHouse) {
  if (!canUseStorage()) return house
  const raw = JSON.stringify(house)
  if (raw === cachedRaw) {
    if (!applyingRemote) schedulePush(cachedHouse ?? house)
    return cachedHouse ?? house
  }
  window.localStorage.setItem(KEY, raw)
  cachedRaw = raw
  cachedHouse = house
  emit()
  if (!applyingRemote) schedulePush(house)
  return house
}

export function subscribeHouse(listener: Listener) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key != null) return
    cachedRaw = undefined
    listener()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }
  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
    }
  }
}

export function useHouse() {
  return useSyncExternalStore(subscribeHouse, currentHouse, () => null)
}

export function useAccountStatus() {
  return useSyncExternalStore(subscribeHouse, () => sessionStatus, () => 'unknown' as AccountStatus)
}

export async function hydrateHouse() {
  if (!canUseStorage()) {
    sessionStatus = 'out'
    emit()
    return
  }
  if (hydratePromise) return hydratePromise
  hydratePromise = (async () => {
    try {
      const result = await fetchWorkspaceHouse()
      if (result.status === 401) {
        sessionStatus = 'out'
        emit()
        return
      }
      const server = asHouse(result.house)
      if (!server) {
        sessionStatus = 'out'
        emit()
        return
      }
      sessionStatus = 'in'
      const merged = mergeLocalIfServerEmpty(server, loadHouse())
      applyingRemote = true
      writeHouse(merged)
      applyingRemote = false
      emit()
      if (JSON.stringify(merged) !== JSON.stringify(server)) schedulePush(merged)
    } catch {
      if (sessionStatus === 'unknown') {
        sessionStatus = 'out'
        emit()
      }
    } finally {
      hydratePromise = null
    }
  })()
  return hydratePromise
}

export function saveAccount(patch: WorkspaceAccountPatch) {
  const house = loadHouse()
  if (!house || sessionStatus !== 'in') return null
  const next: WorkspaceHouse = { ...house }
  if (typeof patch.email === 'string' && patch.email && next.auth !== 'email') {
    next.email = patch.email
  }
  if (patch.auth) next.auth = patch.auth
  if (patch.plan) next.plan = patch.plan
  if (typeof patch.stripeCustomerId === 'string' && patch.stripeCustomerId) {
    next.stripeCustomerId = patch.stripeCustomerId
  }
  if (typeof patch.stripeSubscriptionId === 'string' && patch.stripeSubscriptionId) {
    next.stripeSubscriptionId = patch.stripeSubscriptionId
  }
  if (patch.planUpdatedAt) next.planUpdatedAt = patch.planUpdatedAt
  return writeHouse(next)
}

export async function signOut() {
  try {
    await logoutWorkspace()
  } catch {
    // Cookie clear can fail offline; this device still drops the cache.
  }
  if (typeof window !== 'undefined') window.clearTimeout(pushTimer)
  sessionStatus = 'out'
  if (!canUseStorage()) {
    emit()
    return
  }
  window.localStorage.removeItem(KEY)
  cachedRaw = null
  cachedHouse = null
  emit()
}

function keepSkipToken(snapshot: ResultSnapshot) {
  return `${snapshot.code}:${JSON.stringify(snapshot.percents ?? {})}`
}

export function skipKeepSnapshot(snapshot: ResultSnapshot) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(KEEP_SKIP_KEY, keepSkipToken(snapshot))
}

export function keepSnapshotWasSkipped(snapshot: ResultSnapshot) {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(KEEP_SKIP_KEY) === keepSkipToken(snapshot)
}

/** Eight percentages from this browser. Never creates a self. Never answers. */
export function pullQuizPercents() {
  const snapshot = loadResultSnapshot()
  if (!snapshot) return null
  const house = loadHouse()
  if (!house?.self) return null
  if (JSON.stringify(house.self.percents ?? {}) === JSON.stringify(snapshot.percents ?? {})) {
    return house
  }
  return saveSelfSnapshot({ ...house.self, percents: snapshot.percents })
}

export function saveSelfSnapshot(snapshot: ResultSnapshot | null) {
  const house = loadHouse()
  if (!house) return null
  const typeChanged = snapshot != null && house.self?.code !== snapshot.code
  const hours = typeChanged
    ? house.hours.map((tag) => ({
        ...tag,
        code: snapshot.code,
        hint: weatherHint(snapshot.stack, tag.weather),
      }))
    : house.hours
  return writeHouse({ ...house, self: snapshot, hours })
}

export function addPerson(person: Omit<WorkspacePerson, 'id'>) {
  const house = loadHouse()
  if (!house) return null
  const next: WorkspacePerson = { ...person, id: crypto.randomUUID() }
  return writeHouse({ ...house, people: [...house.people, next] })
}

export function updatePerson(id: string, patch: Partial<WorkspacePerson>) {
  const house = loadHouse()
  if (!house) return null
  return writeHouse({
    ...house,
    people: house.people.map((person) => (person.id === id ? { ...person, ...patch } : person)),
  })
}

/** Friend's type and eight percentages. Never answers. */
export function applyPersonSnapshot(id: string, snapshot: ResultSnapshot) {
  return updatePerson(id, {
    code: snapshot.code,
    percents: snapshot.percents,
    source: 'quiz',
  })
}

export function removePerson(id: string) {
  const house = loadHouse()
  if (!house) return null
  return writeHouse({ ...house, people: house.people.filter((person) => person.id !== id) })
}

export function addHour(
  weather: HourWeather,
  note: string,
  self: ResultSnapshot | null = null,
  span: HourSpan = 'hour',
) {
  const house = loadHouse()
  if (!house) return null
  const tag: HourTag = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    weather,
    note,
    code: self?.code,
    hint: self ? weatherHint(self.stack, weather) : undefined,
    span,
  }
  return writeHouse({ ...house, hours: [tag, ...house.hours] })
}
