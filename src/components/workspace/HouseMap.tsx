import { BEEBE_ROLES, beebeStack } from '../../data/beebe'
import { FUNCTIONS, type FunctionId } from '../../data/functions'
import { typeByCode } from '../../data/personalityTypes'
import { circleTitle, personCircle, type WorkspaceCircle } from '../../lib/workspace/circle'
import type { ResultSnapshot, WorkspacePerson } from '../../lib/workspace/types'
import { Button } from '../Button'

const SHORT: Record<string, string> = {
  hero: 'Hero',
  parent: 'Parent',
  child: 'Child',
  anima: 'Inferior',
  opposing: 'Opposing',
  senex: 'Critic',
  trickster: 'Trickster',
  demon: 'Demon',
}

const GROUPS: { title: string; ids: FunctionId[] }[] = [
  { title: 'Perceiving', ids: ['Ni', 'Ne', 'Si', 'Se'] },
  { title: 'Judging', ids: ['Ti', 'Te', 'Fi', 'Fe'] },
]

type Member = {
  id: string
  name: string
  you: boolean
  hero: FunctionId
  code: string
}

function roleAt(self: ResultSnapshot | null, id: FunctionId) {
  if (!self) return null
  const index = beebeStack(self.stack).indexOf(id)
  if (index < 0) return null
  const role = BEEBE_ROLES[index]
  return { index, key: role.key, label: SHORT[role.key] ?? role.label }
}

function membersOf(self: ResultSnapshot | null, people: WorkspacePerson[], circle: WorkspaceCircle) {
  const list: Member[] = []
  if (self) {
    list.push({ id: 'me', name: 'You', you: true, hero: self.stack[0], code: self.code })
  }
  for (const person of people) {
    if (personCircle(person) !== circle) continue
    const type = person.code ? typeByCode(person.code) : undefined
    if (!type) continue
    list.push({
      id: person.id,
      name: person.name,
      you: false,
      hero: type.stack[0],
      code: type.code,
    })
  }
  return list
}

function tieLine(self: ResultSnapshot, person: WorkspacePerson) {
  const type = person.code ? typeByCode(person.code) : undefined
  if (!type) return null
  if (type.code === self.code) {
    return `${person.name} is the same stack.`
  }
  const role = roleAt(self, type.stack[0])
  if (!role) return `${person.name} leads with ${type.stack[0]}.`
  return `${person.name} leads with ${type.stack[0]}, your ${role.label}.`
}

export function HouseMap({
  self,
  people,
  circle,
  onCircle,
  onOpenPerson,
  onOpenMe,
  onAdd,
}: {
  self: ResultSnapshot | null
  people: WorkspacePerson[]
  circle: WorkspaceCircle
  onCircle: (circle: WorkspaceCircle) => void
  onOpenPerson: (id: string) => void
  onOpenMe: () => void
  onAdd?: () => void
}) {
  const members = membersOf(self, people, circle)
  const waiting = people.filter((person) => personCircle(person) === circle && !person.code)
  const ties = self
    ? people
        .filter((person) => personCircle(person) === circle)
        .map((person) => ({ person, line: tieLine(self, person) }))
        .filter((item) => item.line)
    : []

  function open(id: string) {
    if (id === 'me') onOpenMe()
    else onOpenPerson(id)
  }

  return (
    <>
      <p className="lede">
        {circle === 'team'
          ? 'Who leads with what on the team. Not a ranking.'
          : 'Who holds which function at home. Not a ranking.'}
      </p>
      <div className="workspace-tiles workspace-tiles--two">
        {(['household', 'team'] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={circle === item ? 'workspace-tile is-on' : 'workspace-tile'}
            onClick={() => onCircle(item)}
          >
            <strong>{circleTitle(item)}</strong>
            <span>{item === 'team' ? 'Work, clients' : 'Family, home'}</span>
          </button>
        ))}
      </div>
      {self ? (
        GROUPS.map((group) => (
          <div key={group.title} className="workspace-chart__block">
            <span className="workspace-chart__ring-label">{group.title}</span>
            <div className="workspace-map">
              {group.ids.map((id) => {
                const role = roleAt(self, id)
                const here = members.filter((member) => member.hero === id)
                const anima = role?.key === 'anima'
                const classes = ['workspace-room', anima ? 'is-anima' : ''].filter(Boolean).join(' ')
                return (
                  <div key={id} className={classes}>
                    <span className="workspace-room__fn">{id}</span>
                    <span className="workspace-room__role">
                      {role ? `your ${role.label}` : FUNCTIONS[id].name}
                    </span>
                    {here.length ? (
                      <div className="workspace-room__who">
                        {here.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            className={member.you ? 'workspace-chip is-you' : 'workspace-chip'}
                            onClick={() => open(member.id)}
                          >
                            {member.you ? 'You' : member.name} · {member.code}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="workspace-room__empty">empty</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        <p className="note">Name a type on Me first. The map follows that stack.</p>
      )}
      {ties.length ? (
        <ul className="workspace-ties">
          {ties.map(({ person, line }) => (
            <li key={person.id}>
              <button type="button" className="workspace-tie" onClick={() => onOpenPerson(person.id)}>
                {line}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {waiting.length ? (
        <p className="note">
          {waiting.map((person) => person.name).join(', ')} {waiting.length === 1 ? 'has' : 'have'} no
          type yet.
        </p>
      ) : null}
      {self && members.length <= 1 ? (
        onAdd ? (
          <div className="hero__actions">
            <Button onClick={onAdd}>Add someone</Button>
          </div>
        ) : (
          <p className="note">Add someone and mark them {circleTitle(circle).toLowerCase()}.</p>
        )
      ) : null}
    </>
  )
}
