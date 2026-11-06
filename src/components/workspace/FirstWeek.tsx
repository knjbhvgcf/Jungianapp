import { useEffect, useState, type FormEvent } from 'react'
import { PERSONALITY_TYPES, typeByCode } from '../../data/personalityTypes'
import { groupsOf } from '../../lib/workspace/circle'
import { firstWeekPerson } from '../../lib/workspace/firstWeek'
import { readInviteSnapshot } from '../../lib/workspace/inviteClient'
import { inviteQuizHref, newInviteToken } from '../../lib/workspace/invitePacket'
import { snapshotFromShare } from '../../lib/workspace/sharePacket'
import {
  addFirstWeekPerson,
  keepInviteArrival,
  loadHouse,
} from '../../lib/workspace/store'
import { armInvitePing, askToPingThisDevice } from '../../lib/workspace/inviteWatch'
import type { WorkspaceHouse } from '../../lib/workspace/types'
import { Button } from '../Button'

export function FirstWeek({
  house,
  onSkip,
  onCompare,
}: {
  house: WorkspaceHouse
  onSkip: () => void
  onCompare: (personId: string) => void
}) {
  const person = firstWeekPerson(house)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [code, setCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [paste, setPaste] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [lookNote, setLookNote] = useState('')
  const [lookBusy, setLookBusy] = useState(false)

  const inviteHref =
    person && person.inviteToken && typeof window !== 'undefined'
      ? inviteQuizHref(window.location.origin, person.inviteToken)
      : ''

  useEffect(() => {
    setPaste('')
    setPasteError('')
    setLinkCopied(false)
    setLookNote('')
  }, [person?.id])

  useEffect(() => {
    if (!person?.inviteToken || person.code) return
    let cancelled = false
    async function look() {
      const result = await readInviteSnapshot(person!.inviteToken ?? '')
      if (cancelled || !result.ok || !result.snapshot) return
      keepInviteArrival(person!.id, result.snapshot)
    }
    void look()
    const timer = window.setInterval(() => void look(), 4000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [person?.id, person?.inviteToken, person?.code])

  function onAdd(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const named = code ? typeByCode(code) : undefined
    const token = newInviteToken()
    addFirstWeekPerson({
      name: trimmed,
      relation: relation.trim() || 'Friend',
      source: named ? 'named' : 'invite',
      code: named?.code,
      trigger: '',
      comfort: '',
      inviteToken: token,
      circle: groupName.trim() || undefined,
    })
    if (!named) armInvitePing(token, trimmed, loadHouse()?.email)
  }

  return (
    <>
      <p className="eyebrow">This week</p>
      <h1 className="serif-title">One person you know</h1>
      {!person ? (
        <>
          <p className="lede">
            Partner, parent, friend. Not Einstein. Not Luffy. Public figures wait in Library.
          </p>
          <form className="workspace-add" onSubmit={onAdd}>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Who they are to you
              <input
                value={relation}
                onChange={(event) => setRelation(event.target.value)}
                placeholder="Partner, mother, friend"
              />
            </label>
            <label>
              Their type, if you know it
              <select value={code} onChange={(event) => setCode(event.target.value)}>
                <option value="">I don&apos;t know yet</option>
                {PERSONALITY_TYPES.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.code} · {type.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Group
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                list="first-week-groups"
                placeholder="Family, work, band"
              />
            </label>
            <datalist id="first-week-groups">
              {groupsOf(house).map((group) => (
                <option key={group.id} value={group.name} />
              ))}
            </datalist>
            <Button type="submit">Add</Button>
          </form>
        </>
      ) : person.code ? (
        <>
          <p className="lede">
            {person.name} is in. See you two side by side.
          </p>
          <p className="mono-stat">
            {person.relation}
            {person.code ? ` · ${person.code}` : ''}
          </p>
          <div className="hero__actions">
            <Button onClick={() => onCompare(person.id)}>Compare</Button>
          </div>
        </>
      ) : (
        <>
          <p className="lede">
            Send {person.name} the quiz. They send type and eight percentages from Results.
          </p>
          <div className="hero__actions">
            {inviteHref ? (
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteHref)
                    askToPingThisDevice()
                    armInvitePing(person.inviteToken, person.name, loadHouse()?.email)
                    setLinkCopied(true)
                    window.setTimeout(() => setLinkCopied(false), 2000)
                  } catch {
                    setLinkCopied(false)
                  }
                }}
              >
                {linkCopied ? 'Copied' : 'Copy quiz link'}
              </Button>
            ) : null}
            {person.inviteToken ? (
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  setLookBusy(true)
                  const result = await readInviteSnapshot(person.inviteToken ?? '')
                  setLookBusy(false)
                  if (!result.ok) {
                    setLookNote(result.error)
                    return
                  }
                  if (!result.snapshot) {
                    setLookNote('Nothing yet. They finish the quiz and send from Results.')
                    return
                  }
                  keepInviteArrival(person.id, result.snapshot)
                  setLookNote(`Kept ${result.snapshot.code}.`)
                }}
              >
                {lookBusy ? 'Looking…' : 'Look for their result'}
              </Button>
            ) : null}
          </div>
          {lookNote ? <p className="note">{lookNote}</p> : null}
          <form
            className="workspace-add"
            onSubmit={(event) => {
              event.preventDefault()
              const snapshot = snapshotFromShare(paste)
              if (!snapshot) {
                setPasteError('Need a type and the eight percentages. Not the answers.')
                return
              }
              keepInviteArrival(person.id, snapshot)
              setPaste('')
              setPasteError('')
            }}
          >
            <label>
              Paste their percentages
              <textarea
                value={paste}
                onChange={(event) => {
                  setPaste(event.target.value)
                  setPasteError('')
                }}
                rows={3}
                placeholder="jungology INFP Fi72 Ne64 …"
              />
            </label>
            {pasteError ? <p className="note">{pasteError}</p> : null}
            <Button type="submit" variant="ghost">
              Keep
            </Button>
          </form>
        </>
      )}
      <div className="hero__actions">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
      <p className="note">
        They stay in Library if you already added them. Come back when you want.
      </p>
    </>
  )
}
