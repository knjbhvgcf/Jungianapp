import types from '../content/types.json'
import type { TypeContent } from '../content/schema'
import type { FunctionId } from './functions'

export type PersonalityType = {
  code: string
  title: string
  name: string
  stack: [FunctionId, FunctionId, FunctionId, FunctionId]
  summary: string
  image?: string
  populationPercent: number
}

export const PERSONALITY_TYPES: PersonalityType[] = (types as unknown as TypeContent[]).map(
  (type) => ({
    code: type.code,
    title: type.title,
    name: type.name,
    stack: type.stack,
    summary: type.summary,
    image: type.image,
    populationPercent: type.populationPercent,
  }),
)

/** Approximate share of people, e.g. "about 1.5% of people". */
export function formatPopulationShare(percent: number) {
  return `about ${percent}% of people`
}

export function typeByCode(code: string) {
  const needle = code.trim().toUpperCase()
  return PERSONALITY_TYPES.find((type) => type.code === needle)
}

export function typePath(code: string) {
  return `/types/${code.trim().toLowerCase()}`
}
