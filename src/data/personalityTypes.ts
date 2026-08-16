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
}

export const PERSONALITY_TYPES: PersonalityType[] = (types as unknown as TypeContent[]).map(
  (type) => ({
    code: type.code,
    title: type.title,
    name: type.name,
    stack: type.stack,
    summary: type.summary,
    image: type.image,
  }),
)
