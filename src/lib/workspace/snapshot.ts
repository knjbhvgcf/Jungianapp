import { applyFollowUpToProfile } from '../clarify'
import { typeByCode } from '../../data/personalityTypes'
import { matchForSpine, preferredParent, validParentsForHero, buildProfile, isQuizComplete } from '../scoring'
import { loadAnswers, loadClarifyAnswers, loadStackChoice } from '../storage'
import type { ResultSnapshot } from './types'

/** Named type for the house. No quiz answers. Keeps existing percentages. */
export function snapshotFromType(code: string, previous: ResultSnapshot | null = null): ResultSnapshot | null {
  const type = typeByCode(code)
  if (!type) return null
  return {
    code: type.code,
    title: type.title,
    stack: [type.stack[0], type.stack[1], type.stack[2], type.stack[3]],
    percents: previous?.percents ?? {},
  }
}

/** Type and eight percentages from this browser. Never includes answers. */
export function loadResultSnapshot(): ResultSnapshot | null {
  const answers = loadAnswers()
  if (!isQuizComplete(answers)) return null
  const profile = applyFollowUpToProfile(buildProfile(answers), loadClarifyAnswers())
  const stored = loadStackChoice()
  const top = profile.matches[0]
  if (!top) return null
  const hero = stored?.hero ?? top.stack[0]
  const parents = validParentsForHero(hero)
  const parent =
    stored && stored.hero === hero && parents.includes(stored.parent)
      ? stored.parent
      : preferredParent(hero, profile.scores, profile.pairs)
  const chosen = matchForSpine(profile.matches, hero, parent) ?? top
  const percents: ResultSnapshot['percents'] = {}
  for (const score of profile.scores) {
    percents[score.id] = Math.max(0, Math.min(100, score.percent))
  }
  return {
    code: chosen.code,
    title: chosen.title,
    stack: chosen.stack,
    percents,
  }
}
