import { applyFollowUpToProfile } from '../clarify'
import { matchForSpine, preferredParent, validParentsForHero, buildProfile, isQuizComplete } from '../scoring'
import { loadAnswers, loadClarifyAnswers, loadStackChoice } from '../storage'
import { snapshotFromType } from './fromType'
import type { ResultSnapshot } from './types'

export { snapshotFromType }

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
