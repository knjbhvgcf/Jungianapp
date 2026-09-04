import types from '../content/types.json'
import type { TypeContent } from '../content/schema'

export type TypeMapCopy = {
  myth: string
  tension: string
  inTheDay: string
  atWork: string
  withOthers: string
  auxiliaryHealing: string
  antiTypeStress: string
  famous: string
  growth: string
  shadowWork: string
  prompts: string[]
}

export const TYPE_MAPS: Record<string, TypeMapCopy> = Object.fromEntries(
  (types as unknown as TypeContent[]).map((type) => [
    type.code,
    {
      myth: type.myth,
      tension: type.tension,
      inTheDay: type.inTheDay,
      atWork: type.atWork,
      withOthers: type.withOthers,
      auxiliaryHealing: type.auxiliaryHealing,
      antiTypeStress: type.antiTypeStress,
      famous: type.famous,
      growth: type.growth,
      shadowWork: type.shadowWork,
      prompts: type.prompts,
    },
  ]),
)
