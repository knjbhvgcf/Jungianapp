import { useEffect, useRef, useState } from 'react'
import { BEEBE_ROLES, beebeStack } from '../../data/beebe'
import { FUNCTIONS, type FunctionId } from '../../data/functions'
import { typeByCode } from '../../data/personalityTypes'
import { groupTitle, personGroupId, type WorkspaceCircle } from '../../lib/workspace/circle'
import type { ResultSnapshot, WorkspaceGroup, WorkspacePerson } from '../../lib/workspace/types'
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

function membersOf(
  self: ResultSnapshot | null,
  people: WorkspacePerson[],
  circle: WorkspaceCircle,
) {
  const list: Member[] = []
  if (self) {
    list.push({ id: 'me', name: 'You', you: true, hero: self.stack[0], code: self.code })
  }
  for (const person of people) {
    if (personGroupId(person) !== circle) continue
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
  groups,
  circle,
  onCircle,
  onRename,
  onOpenPerson,
  onOpenMe,
  onAdd,
}: {
  self: ResultSnapshot | null
  people: WorkspacePerson[]
  groups: WorkspaceGroup[]
  circle: WorkspaceCircle
  onCircle: (circle: WorkspaceCircle) => void
  onRename?: (id: string, name: string) => void
  onOpenPerson: (id: string) => void
  onOpenMe: () => void
  onAdd?: () => void
}) {
  const title = groupTitle(circle, groups)
  const [draft, setDraft] = useState(title)
  const focused = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const members = membersOf(self, people, circle)
  const waiting = people.filter((person) => personGroupId(person) === circle && !person.code)
  const ties = self
    ? people
        .filter((person) => personGroupId(person) === circle)
        .map((person) => ({ person, line: tieLine(self, person) }))
        .filter((item) => item.line)
    : []

  useEffect(() => {
    if (!focused.current) setDraft(title)
  }, [title])

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  function open(id: string) {
    if (id === 'me') onOpenMe()
    else onOpenPerson(id)
  }

  function saveName(raw = draft) {
    const next = raw.trim()
    if (!next || !circle || next === title) {
      if (!focused.current) setDraft(title)
      return
    }
    onRename?.(circle, next)
  }

  function onName(value: string) {
    setDraft(value)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => saveName(value), 350)
  }

  return (
    <>
      <p className="lede">
        {title ? `Who leads with what in ${title}. Not a ranking.` : 'Name a group, then add people to it.'}
      </p>
      {groups.length ? (
        <div className="workspace-pills">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={circle === group.id ? 'workspace-pill is-on' : 'workspace-pill'}
              onClick={() => onCircle(group.id)}
            >
              {group.name}
            </button>
          ))}
        </div>
      ) : null}
      {circle && onRename ? (
        <div className="workspace-add">
          <label>
            Group name
            <input
              value={draft}
              placeholder="Family, work, band"
              onChange={(event) => onName(event.target.value)}
              onFocus={() => {
                focused.current = true
              }}
              onBlur={() => {
                focused.current = false
                if (timer.current) window.clearTimeout(timer.current)
                saveName()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
            />
          </label>
        </div>
      ) : null}
      {self && circle ? (
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
      ) : self ? null : (
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
          <p className="note">Add someone and name the group they belong in.</p>
        )
      ) : null}
    </>
  )
}
