import types from '../content/types.json'
import type { TypeContent, TypeRoleCopy } from '../content/schema'

export type RolePortrait = TypeRoleCopy

export type ArchetypePage = {
  mythic: string
  tagline: string
  dominantName: string
  auxiliaryName: string
  bridge: string
  pattern: string
  image: string
  roles: RolePortrait[]
}

export function archetypePage(code: string): ArchetypePage | undefined {
  const type = (types as TypeContent[]).find((item) => item.code === code.toUpperCase())
  if (!type?.mythic) return undefined
  return {
    mythic: type.mythic,
    tagline: type.tagline,
    dominantName: type.dominantName,
    auxiliaryName: type.auxiliaryName,
    bridge: type.bridge,
    pattern: type.pattern,
    image: type.patternNote,
    roles: type.roles ?? [],
  }
}
