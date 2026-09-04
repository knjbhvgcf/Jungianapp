import type { FunctionId } from '../data/functions'
import type { QuestionFacet } from '../data/questions'

export type QuestionDraft = {
  functionId: FunctionId
  facet: QuestionFacet
  text: string
  reverse?: boolean
}

export type QuestionsContent = Record<FunctionId, QuestionDraft[]>

export type FollowupDraft = {
  prompt: string
  aText: string
  bText: string
}

export type FollowupContent = {
  attitude: Record<string, FollowupDraft[]>
  rival: Record<string, FollowupDraft[]>
}

export type HomeContent = {
  seoTitle: string
  seoDescription: string
  title: string
  stat: string
  lede: string
  image: string
  beginQuiz: string
  howHeading: string
  steps: { title: string; body: string }[]
  functionsHeading: string
  functionsIntro: string
  faqHeading: string
  faq: { q: string; a: string }[]
  ctaHeading: string
}

export type AboutContent = {
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  stat: string
  lede: string
  beginQuiz: string
  sections: { heading: string; paragraphs: string[] }[]
}

export type ResultsContent = {
  seoTitleEmpty: string
  seoDescriptionEmpty: string
  seoTitle: string
  seoDescription: string
  emptyTitle: string
  emptyStat: string
  emptyBody: string
  beginQuiz: string
  scoresHeading: string
  scoresIntro: string
  arrangeStack: string
  openMap: string
  unlockMap: string
  openCompat: string
  compatShort: string
  closeNote: string
  alsoClosePrefix: string
  mapEyebrow: string
  mapTitle: string
  mapTitleLocked: string
  mapBodyUnlocked: string
  mapBodyLocked: string
  mapCtaUnlocked: string
  mapCtaLocked: string
  compatEyebrow: string
  compatTitle: string
  compatBodyUnlocked: string
  compatBodyLocked: string
  compatCtaUnlocked: string
  compatCtaLocked: string
  retake: string
  clearAnswers: string
  copySummary: string
  copied: string
  methodLink: string
}

export type UnlockCopy = {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  cta: string
  keyLabel: string
  keyPlaceholder: string
  unlockButton: string
  error: string
  checkoutMissing: string
}

export type MapPageCopy = {
  emptySeoTitle: string
  emptySeoDescription: string
  emptyTitle: string
  emptyStat: string
  emptyBody: string
  beginQuiz: string
  seoLockedTitle: string
  seoDescription: string
  eyebrow: string
  teaserHeading: string
  teaserBody: string
  teaserRoles: string
  teaserBeebe: string
  teaserCloseFallback: string
  teaserChapters: string
  backToResults: string
  auxiliaryHeading: string
  auxiliaryLead: string
  antiTypeHeading: string
  antiTypeLead: string
  famousHeading: string
  compatEyebrow: string
  compatTitle: string
  compatBody: string
  compatCta: string
  disclaimer: string
  print: string
  backToResultsButton: string
  compatButton: string
}

export type CompatPageCopy = {
  emptySeoTitle: string
  emptySeoDescription: string
  emptyTitle: string
  emptyStat: string
  emptyBody: string
  beginQuiz: string
  seoLockedTitle: string
  seoDescription: string
  eyebrow: string
  heading: string
  disclaimer: string
  print: string
  backToResultsButton: string
  mapButton: string
  backLink: string
}

export type PaywallContent = {
  map: UnlockCopy
  compat: UnlockCopy
  mapPage: MapPageCopy
  compatPage: CompatPageCopy
}

export type PagesContent = {
  home: HomeContent
  about: AboutContent
  results: ResultsContent
  paywall: PaywallContent
}

export type TypeRoleCopy = {
  name: string
  description: string
}

export type TypeContent = {
  code: string
  title: string
  name: string
  stack: [FunctionId, FunctionId, FunctionId, FunctionId]
  summary: string
  image: string
  tagline: string
  mythic: string
  dominantName: string
  auxiliaryName: string
  bridge: string
  pattern: string
  patternNote: string
  roles: TypeRoleCopy[]
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

export type CmsFile = 'pages' | 'questions' | 'followup' | 'types' | 'guides'
