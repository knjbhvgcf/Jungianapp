import { applyFollowUpToProfile } from '../../src/lib/clarify'
import {
  buildProfile,
  isQuizComplete,
  matchForSpine,
  preferredParent,
  validParentsForHero,
} from '../../src/lib/scoring'
import type { ResultSnapshot } from '../../src/lib/workspace/types'
import { loadAnswers, loadClarifyAnswers, loadStackChoice } from './storage'

/** Type and eight percentages from this phone. Never includes answers. */
export async function loadResultSnapshot(): Promise<ResultSnapshot | null> {
  const answers = await loadAnswers()
  if (!isQuizComplete(answers)) return null
  const [clarify, stored] = await Promise.all([loadClarifyAnswers(), loadStackChoice()])
  const profile = applyFollowUpToProfile(buildProfile(answers), clarify)
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
