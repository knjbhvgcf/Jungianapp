import type { FunctionId } from './functions'

export type BeebeRing = 'ego' | 'shadow'

export type BeebeRole = {
  key: string
  label: string
  full: string
  ring: BeebeRing
  blurb: string
}

export const OPPOSITE_FUNCTION: Record<FunctionId, FunctionId> = {
  Ni: 'Ne',
  Ne: 'Ni',
  Si: 'Se',
  Se: 'Si',
  Ti: 'Te',
  Te: 'Ti',
  Fi: 'Fe',
  Fe: 'Fi',
}

export const BEEBE_ROLES: BeebeRole[] = [
  {
    key: 'hero',
    label: 'Hero',
    full: 'Hero / Heroine',
    ring: 'ego',
    blurb: 'The leading conscious function. Identity, competence, what you trust first.',
  },
  {
    key: 'parent',
    label: 'Parent',
    full: 'Good Parent',
    ring: 'ego',
    blurb: 'The supporting function. How you foster, teach, and take responsibility.',
  },
  {
    key: 'child',
    label: 'Child',
    full: 'Puer / Puella',
    ring: 'ego',
    blurb: 'Play, relief, and inflation. Younger, less reliable, often charming.',
  },
  {
    key: 'anima',
    label: 'Anima',
    full: 'Anima / Animus',
    ring: 'ego',
    blurb: 'The inferior function. Aspiration, embarrassment, and what you project onto others.',
  },
  {
    key: 'opposing',
    label: 'Opposing',
    full: 'Opposing Personality',
    ring: 'shadow',
    blurb: 'The opposite attitude of the hero. Contrariness, “yes, but,” and defensive spin.',
  },
  {
    key: 'senex',
    label: 'Senex',
    full: 'Senex / Witch',
    ring: 'shadow',
    blurb: 'The shadow of the parent. Criticism, limit-setting, and bitterness.',
  },
  {
    key: 'trickster',
    label: 'Trickster',
    full: 'Trickster',
    ring: 'shadow',
    blurb: 'The shadow of the child. Double binds, mischief, and escape hatches.',
  },
  {
    key: 'demon',
    label: 'Demon',
    full: 'Demon / Daimon',
    ring: 'shadow',
    blurb: 'The most unconscious. Undermining — and, in later work, a source of transformation.',
  },
]

export type FunctionStack = [
  FunctionId,
  FunctionId,
  FunctionId,
  FunctionId,
  FunctionId,
  FunctionId,
  FunctionId,
  FunctionId,
]

export function beebeStack(
  ego: [FunctionId, FunctionId, FunctionId, FunctionId],
): FunctionStack {
  const [hero, parent, child, anima] = ego
  return [
    hero,
    parent,
    child,
    anima,
    OPPOSITE_FUNCTION[hero],
    OPPOSITE_FUNCTION[parent],
    OPPOSITE_FUNCTION[child],
    OPPOSITE_FUNCTION[anima],
  ]
}
