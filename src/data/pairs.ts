import type { FunctionId } from './functions'
import { PERSONALITY_TYPES } from './personalityTypes'

export function pairKey(hero: FunctionId, parent: FunctionId) {
  return `${hero}-${parent}`
}

export function rivalParent(hero: FunctionId, parent: FunctionId) {
  return PERSONALITY_TYPES.filter((type) => type.stack[0] === hero)
    .map((type) => type.stack[1])
    .find((id) => id !== parent)
}
