import { beebeStack } from './beebe'
import { FUNCTIONS, type FunctionId } from './functions'
import { PERSONALITY_TYPES, type PersonalityType } from './personalityTypes'

export type CompatKind =
  | 'same'
  | 'sister'
  | 'mirror'
  | 'parent'
  | 'child'
  | 'anima'
  | 'opposing'
  | 'senex'
  | 'trickster'
  | 'demon'

export type CompatCharge = 'steady' | 'mixed' | 'charged'

export type CompatRow = {
  other: PersonalityType
  kind: CompatKind
  label: string
  charge: CompatCharge
  note: string
  detail: string
}

const KIND_META: Record<
  CompatKind,
  { label: string; charge: CompatCharge; order: number }
> = {
  same: { label: 'Same stack', charge: 'steady', order: 0 },
  sister: { label: 'Same hero', charge: 'mixed', order: 1 },
  mirror: { label: 'Hero and parent swapped', charge: 'mixed', order: 2 },
  parent: { label: 'Speaks your Parent', charge: 'steady', order: 3 },
  child: { label: 'Speaks your Child', charge: 'mixed', order: 4 },
  anima: { label: 'Anima pull', charge: 'charged', order: 5 },
  opposing: { label: 'Opposing personality', charge: 'charged', order: 6 },
  senex: { label: 'Senex / Witch', charge: 'charged', order: 7 },
  trickster: { label: 'Trickster', charge: 'mixed', order: 8 },
  demon: { label: 'Demon / Daimon', charge: 'charged', order: 9 },
}

const KIND_BY_HERO_INDEX: CompatKind[] = [
  'same',
  'parent',
  'child',
  'anima',
  'opposing',
  'senex',
  'trickster',
  'demon',
]

function fnName(id: FunctionId) {
  return `${id} (${FUNCTIONS[id].name})`
}

function kindFor(me: PersonalityType, them: PersonalityType): CompatKind {
  if (me.code === them.code) return 'same'
  if (them.stack[0] === me.stack[1] && them.stack[1] === me.stack[0]) return 'mirror'
  if (them.stack[0] === me.stack[0]) return 'sister'
  const index = beebeStack(me.stack).indexOf(them.stack[0])
  return KIND_BY_HERO_INDEX[index] ?? 'same'
}

function copyFor(me: PersonalityType, them: PersonalityType, kind: CompatKind): {
  note: string
  detail: string
} {
  const theirHero = them.stack[0]
  const theirParent = them.stack[1]
  const myHero = me.stack[0]
  const myParent = me.stack[1]
  const myChild = me.stack[2]
  const myAnima = me.stack[3]
  const title = them.title
  const mine = me.title

  switch (kind) {
    case 'same':
      return {
        note: `Two of the same type, ${mine}, share a language, and therefore a blind spot, so that recognition is swift and collusion no less so, each taking the other’s ease as proof that the map is already complete.`,
        detail: `You will not have to explain ${fnName(myHero)} or ${fnName(myParent)}, which is a rest, and the risk is that you double the same inflation, both of you postponing ${fnName(myAnima)}, both of you treating ${fnName(myChild)} as a holiday instead of a limit; use each other as witnesses rather than as confirmation that nothing further is required of the psyche, for sameness soothes, and it also conceals.`,
      }
    case 'sister':
      return {
        note: `The ${title} leads with your same hero, ${theirHero}, and cares with ${theirParent} instead of ${myParent}, so that the aim is shared and the stewardship is not, which is a kinship close enough to breed both relief and rivalry.`,
        detail: `You will recognise the ${fnName(myHero)} at once and argue about how people and problems ought to be looked after, their parent, ${fnName(theirParent)}, being not a lesser version of your own but the other valid auxiliary for your hero; rivalry shows itself when one of you treats the other’s care as an amateur performance of a task you privately believe you were born to do.`,
      }
    case 'mirror':
      return {
        note: `The ${title} leads with ${theirHero}, which is your Parent, and supports with ${theirParent}, which is your Hero, so that each of you lives as identity what the other uses to foster.`,
        detail: `This is often high respect and a quiet struggle over who decides, for they inhabit as the self what you inhabit as care, and you inhabit as the self what they inhabit as help; collaboration is excellent when the work needs both, and intimacy needs an explicit agreement about who is leading a given domain, or you will parent each other and then compete, each feeling, not without reason, that the other has taken the chair that was already theirs.`,
      }
    case 'parent':
      return {
        note: `The ${title} leads with ${fnName(theirHero)}, which is how you foster, so that they sound like competence in the very function by which you look after the world, a resemblance that can be a relief or a lecture.`,
        detail: `You may feel useful, impressed, or talked down to, and they may feel taken seriously or treated as a tool of your hero, their parent being ${fnName(theirParent)}; the pairing is easy for projects, and the watch is the urge to keep them in the advisor’s chair instead of letting them be a person with an aim of their own, which your parent function, left unexamined, will not think to ask.`,
      }
    case 'child':
      return {
        note: `The ${title} leads with ${fnName(theirHero)}, which is your Child, so that play is easy and being taken equally seriously is not, a sweetness that can restore you and a slight that can quietly accumulate.`,
        detail: `They can restore you, and you can infantilize them, their parent being ${fnName(theirParent)}, which is adult in a way you may not expect if you meet only their hero; if they meet only your child, they will not know when you are actually in charge, and both misreadings are kinds of fondness that eventually ask to be corrected.`,
      }
    case 'anima':
      return {
        note: `The ${title} leads with ${fnName(theirHero)}, which is your inferior function, so that fascination, irritation, and projection travel together here, as they do wherever the unconscious has borrowed a human face.`,
        detail: `Beebe’s anima and animus often wear this face, and you may want them to carry ${theirHero} for you and then resent that they are merely human at it, they supporting with ${fnName(theirParent)}; the work is to relate to them rather than to the missing piece they appear to be, and to practise your own inferior in small doses so that the relationship is not your only classroom, a classroom which, overloaded, becomes a theatre of salvation and blame.`,
      }
    case 'opposing':
      return {
        note: `The ${title} leads with ${fnName(theirHero)}, the other attitude of your hero, so that arguments arise which sound like you turned inside out, a quarrel with the peculiar heat of a dispute inside one house.`,
        detail: `They are not your opposite so much as your ${myHero} facing the other way, and debates can clarify or never end, their parent being ${fnName(theirParent)}; if you hear only a block, you miss the defense, for sometimes they are protecting an aim your hero is steamrolling, and it is worth naming the shared function before you name the fight, lest you spend years opposing what is already, in another attitude, your own.`,
      }
    case 'senex':
      return {
        note: `The ${title} leads with ${fnName(theirHero)}, the shadow of your Parent, so that you may hear a critic where they hear a standard, and the ear you bring will decide half of what is said.`,
        detail: `The senex, or witch, is the parent after kindness has left the building, which is a projection until it is not, their parent being ${fnName(theirParent)}; you can use them as a boundary you will not set, or dismiss their competence because it arrives without nurture, and the question is whether they are attacking or whether you are hearing your own withheld no, which has been waiting for a mouth.`,
      }
    case 'trickster':
      return {
        note: `The ${title} leads with ${fnName(theirHero)}, the shadow of your Child, so that humour, loopholes, and binds gather here, and what feels like play may also be an escape neither of you has agreed to name.`,
        detail: `They can get you out of a trap and into one you cannot afterwards explain, their parent being ${fnName(theirParent)}; if you recruit them as an escape hatch, you will later call them slippery, and a clean request beats a double message from either of you, for the trickster, invited as a door, resents being blamed for the draught.`,
      }
    case 'demon':
      return {
        note: `The ${title} leads with ${fnName(theirHero)}, your most unconscious function, so that an uncanny heat gathers here, which may be transformation and may be wreckage, and which will not, in any case, be moderate.`,
        detail: `You rarely meet this function as a skill in yourself, so that their fluency can feel like too much, too blunt, or strangely like a missing parent, they supporting with ${fnName(theirParent)}; reality-test the projection before you merge or exile, for used well they show you a value you swore was not yours, and used unthinkingly this pairing becomes a morality play in which no one is allowed to be merely human.`,
      }
  }
}

export function compatibilityFor(me: PersonalityType): CompatRow[] {
  return PERSONALITY_TYPES.map((other) => {
    const kind = kindFor(me, other)
    const meta = KIND_META[kind]
    const { note, detail } = copyFor(me, other, kind)
    return {
      other,
      kind,
      label: meta.label,
      charge: meta.charge,
      note,
      detail,
    }
  }).sort((a, b) => {
    const order = KIND_META[a.kind].order - KIND_META[b.kind].order
    if (order !== 0) return order
    return a.other.code.localeCompare(b.other.code)
  })
}

export function groupedCompatibility(me: PersonalityType) {
  const groups: CompatRow[][] = []
  for (const row of compatibilityFor(me)) {
    const last = groups[groups.length - 1]
    if (last && last[0]?.kind === row.kind) last.push(row)
    else groups.push([row])
  }
  return groups.flatMap((group) => {
    const first = group[0]
    if (!first) return []
    return [[first.kind, group] as const]
  })
}

export const COMPAT_INTRO =
  'This is not a ranking of whom you may love, nor a permission slip for exile, but a reading of the other type’s leading function against your Beebe stack, which is to say against the place that function already occupies in you, whether as hero, parent, child, inferior, or one of the shadow roles; the same language can soothe and it can collude, and the anima and demon placements often carry projection — fascination, irritation, a sense of fate — so that the notes are a map of likely friction and gift, after which you must still look at the actual person, who is never only a type, however complete the diagram may appear.'
