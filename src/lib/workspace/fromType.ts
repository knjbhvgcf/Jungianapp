import { typeByCode } from '../../data/personalityTypes'
import type { ResultSnapshot } from './types'

/** Named type for the house. No quiz answers. Keeps existing percentages. */
export function snapshotFromType(
  code: string,
  previous: ResultSnapshot | null = null,
): ResultSnapshot | null {
  const type = typeByCode(code)
  if (!type) return null
  return {
    code: type.code,
    title: type.title,
    stack: [type.stack[0], type.stack[1], type.stack[2], type.stack[3]],
    percents: previous?.percents ?? {},
  }
}
