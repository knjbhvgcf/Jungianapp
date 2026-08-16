import type { FunctionId } from './functions'

export type FunctionPortrait = {
  concerns: string[]
  asks: string[]
}

export const FUNCTION_PORTRAITS: Record<FunctionId, FunctionPortrait> = {
  Ni: {
    concerns: [
      'hidden patterns',
      'symbolism',
      'underlying meaning',
      'future possibilities',
      'unconscious processes',
      'seeing what is not immediately visible',
    ],
    asks: ['What is the deeper truth behind this?'],
  },
  Ne: {
    concerns: [
      'possibilities',
      'connections between unrelated things',
      'what a situation could become',
      'alternative paths',
      'novelty and the unused door',
    ],
    asks: ['What else could this become?'],
  },
  Si: {
    concerns: [
      'memory and experience',
      'preservation of knowledge',
      'traditions and continuity',
      'internal impressions',
      'what has proven reliable',
      'comparison with past experience',
    ],
    asks: ['What has worked before?', 'What can we learn from what came before?'],
  },
  Se: {
    concerns: [
      'the present moment',
      'sensory detail',
      'timing and impact',
      'action in the given scene',
      'what is actually happening',
    ],
    asks: ['What is happening right now, and what can be done with it?'],
  },
  Ti: {
    concerns: [
      'inner consistency',
      'precise models',
      'definitions',
      'whether the idea itself holds',
      'elegant explanations',
    ],
    asks: ['Does this actually follow?'],
  },
  Te: {
    concerns: [
      'organization',
      'systems',
      'efficiency',
      'measurable results',
      'practical solutions',
    ],
    asks: ['What works, and how do we make it happen?'],
  },
  Fi: {
    concerns: [
      'personal values',
      'authenticity',
      'inner worth',
      'loyalty to what feels right',
      'the private standard that will not be traded for manners',
    ],
    asks: ['Is this still true to me?'],
  },
  Fe: {
    concerns: [
      'people',
      'shared values',
      'social harmony',
      'helping groups',
      'improving human conditions',
    ],
    asks: ['How does this affect the people involved?'],
  },
}
