import { isFigure } from './circle'
import type { WorkspaceHouse, WorkspacePerson } from './types'

export function friendsOf(house: WorkspaceHouse) {
  return house.people.filter((person) => !isFigure(person))
}

export function firstWeekPerson(house: WorkspaceHouse): WorkspacePerson | null {
  const id = house.firstWeek?.personId
  if (!id) return null
  const person = house.people.find((item) => item.id === id)
  if (!person || isFigure(person)) return null
  return person
}

export function offeringFirstWeek(house: WorkspaceHouse) {
  if (!house.self) return false
  const flag = house.firstWeek
  if (flag?.skipped || flag?.done) return false
  if (firstWeekPerson(house)) return true
  return friendsOf(house).length === 0
}
