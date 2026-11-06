import type { WorkspaceCircle, WorkspaceGroup, WorkspaceHouse, WorkspacePerson } from './types'

export type { WorkspaceCircle }

export const FIGURES = 'figures'
export const UNNAMED = 'household'

export function isFiguresId(id: string | undefined) {
  return (id ?? '').trim().toLowerCase() === FIGURES
}

export function isFigure(person: WorkspacePerson) {
  return isFiguresId(person.circle)
}

export function personGroupId(person: WorkspacePerson) {
  if (isFigure(person)) return FIGURES
  if (person.circle && !isFiguresId(person.circle)) return person.circle
  return UNNAMED
}

export function legacyGroupName(id: string) {
  if (id === UNNAMED || id === 'team') return 'Untitled'
  if (isFiguresId(id)) return 'Public figures'
  return id
}

export function groupsOf(house: Pick<WorkspaceHouse, 'groups' | 'people'>): WorkspaceGroup[] {
  const named = [...(house.groups ?? [])].filter((group) => group.id && group.name && !isFiguresId(group.id))
  const seen = new Set(named.map((group) => group.id))
  for (const person of house.people) {
    if (isFigure(person)) continue
    const id = personGroupId(person)
    if (!id || isFiguresId(id) || seen.has(id)) continue
    seen.add(id)
    named.push({ id, name: named.find((group) => group.id === id)?.name ?? legacyGroupName(id) })
  }
  return named
}

export function groupTitle(id: string, groups: WorkspaceGroup[]) {
  if (isFiguresId(id)) return 'Public figures'
  return groups.find((group) => group.id === id)?.name ?? legacyGroupName(id)
}

export function resolveGroup(house: Pick<WorkspaceHouse, 'groups' | 'people'>, name: string): WorkspaceGroup | null {
  const trimmed = name.trim()
  if (!trimmed || isFiguresId(trimmed)) return null
  const groups = groupsOf(house)
  const needle = trimmed.toLowerCase()
  return (
    groups.find((group) => group.id === trimmed || group.name.toLowerCase() === needle) ?? {
      id: newGroupId(),
      name: trimmed,
    }
  )
}

function newGroupId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `group-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
}

export function withGroup(
  house: WorkspaceHouse,
  group: WorkspaceGroup | null,
): WorkspaceHouse {
  if (!group || isFiguresId(group.id)) return house
  const groups = groupsOf(house)
  if (groups.some((item) => item.id === group.id)) {
    return { ...house, groups: groups.map((item) => (item.id === group.id ? group : item)) }
  }
  return { ...house, groups: [...groups, group] }
}

export function placeInGroup(house: WorkspaceHouse, circle: string | undefined) {
  if (!circle) return { house, circle }
  if (isFiguresId(circle)) return { house, circle: FIGURES }
  const group = resolveGroup(house, circle)
  if (!group) return { house, circle }
  return { house: withGroup(house, group), circle: group.id }
}
