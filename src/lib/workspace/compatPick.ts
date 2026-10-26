import { typeByCode, type PersonalityType } from '../../data/personalityTypes'
import type { ResultSnapshot, WorkspacePerson } from './types'

export function pickMe() {
  return 'me'
}

export function pickPerson(id: string) {
  return `person:${id}`
}

export function pickType(code: string) {
  return `type:${code}`
}

export function resolvePick(
  value: string,
  self: ResultSnapshot | null,
  people: WorkspacePerson[],
): { name: string; type: PersonalityType; percents?: ResultSnapshot['percents'] } | null {
  if (value === 'me') {
    const type = self ? typeByCode(self.code) : undefined
    return type ? { name: 'Me', type, percents: self?.percents } : null
  }
  if (value.startsWith('person:')) {
    const person = people.find((item) => item.id === value.slice(7))
    const type = person?.code ? typeByCode(person.code) : undefined
    return person && type ? { name: person.name, type, percents: person.percents } : null
  }
  if (value.startsWith('type:')) {
    const type = typeByCode(value.slice(5))
    return type ? { name: type.title, type } : null
  }
  return null
}
