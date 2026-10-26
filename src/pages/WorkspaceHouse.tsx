import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import { StackPicker } from '../components/StackPicker'
import { TypePortrait } from '../components/TypePortrait'
import { AccountRoom } from '../components/workspace/AccountRoom'
import { CompatPair } from '../components/workspace/CompatPair'
import { EightChart } from '../components/workspace/EightChart'
import { HouseMap } from '../components/workspace/HouseMap'
import { JournalGraph } from '../components/workspace/JournalGraph'
import { PercentBars } from '../components/workspace/PercentBars'
import { FUNCTION_IDS, type FunctionId } from '../data/functions'
import { PERSONALITY_TYPES, typeByCode } from '../data/personalityTypes'
import { preferredParent } from '../lib/scoring'
import { circleTitle, type WorkspaceCircle } from '../lib/workspace/circle'
import { pickMe, pickPerson, pickType, resolvePick } from '../lib/workspace/compatPick'
import { QUIZ_PATH } from '../lib/quizPath'
import {
  markWorkspaceCheckoutCanceled,
  settleWorkspaceCheckout,
} from '../lib/workspace/checkout'
import {
  WORKSPACE_JOIN_PATH,
  WORKSPACE_KEEP_PATH,
  WORKSPACE_NAME,
  WORKSPACE_PATH,
} from '../lib/workspace/offered'
import { encodeShareLine, hasPercents, snapshotFromShare } from '../lib/workspace/sharePacket'
import { loadResultSnapshot, snapshotFromType } from '../lib/workspace/snapshot'
import {
  addHour,
  addPerson,
  applyPersonSnapshot,
  hydrateHouse,
  keepSnapshotWasSkipped,
  pullQuizPercents,
  removePerson,
  saveSelfSnapshot,
  updatePerson,
  useAccountStatus,
  useHouse,
} from '../lib/workspace/store'
import type { HourSpan, HourWeather, ResultSnapshot, WorkspacePerson } from '../lib/workspace/types'
import { HOUR_SPANS, spanLabel, weatherCopy, weatherHint } from '../lib/workspace/weather'

type Room = 'me' | 'journal' | 'library' | 'compat'
type PeopleView = 'list' | 'person' | 'add' | 'map'

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function scoresFromPercents(percents: ResultSnapshot['percents'] | undefined) {
  return FUNCTION_IDS.map((id) => ({
    id,
    raw: 0,
    percent: percents?.[id] ?? 0,
  })).sort((a, b) => b.percent - a.percent)
}

function typeFromSpine(hero: FunctionId, parent: FunctionId) {
  return PERSONALITY_TYPES.find((type) => type.stack[0] === hero && type.stack[1] === parent)
}

function WorkspaceHead({
  title,
  onBack,
  onEdit,
  onAccount,
  editing = false,
}: {
  title?: string
  onBack?: () => void
  onEdit?: () => void
  onAccount?: () => void
  editing?: boolean
}) {
  return (
    <header className={title ? 'workspace-head' : 'workspace-head workspace-head--bare'}>
      {onBack ? (
        <button type="button" className="workspace-head__back" onClick={onBack} aria-label="Back">
          ‹
        </button>
      ) : title ? (
        <span className="workspace-head__back" />
      ) : null}
      {title ? <h1 className="workspace-head__title">{title}</h1> : null}
      {onAccount ? (
        <button type="button" className="workspace-head__edit" onClick={onAccount}>
          account
        </button>
      ) : onEdit ? (
        <button type="button" className="workspace-head__edit" onClick={onEdit}>
          {editing ? 'close' : 'edit'}
        </button>
      ) : title ? (
        <span className="workspace-head__edit" />
      ) : null}
    </header>
  )
}

function MeTypeFold({
  self,
  copied,
  onCopy,
  onChanged,
}: {
  self: ResultSnapshot | null
  copied: boolean
  onCopy: () => void
  onChanged: () => void
}) {
  const quiz = loadResultSnapshot()
  const scores = scoresFromPercents(self?.percents ?? quiz?.percents)
  const hero = self?.stack[0] ?? quiz?.stack[0] ?? scores[0]?.id ?? 'Ni'
  const parent = self?.stack[1] ?? quiz?.stack[1] ?? preferredParent(hero, scores)
  const preview = typeFromSpine(hero, parent) ?? (self ? typeByCode(self.code) : undefined)

  function applySpine(nextHero: FunctionId, nextParent: FunctionId) {
    const type = typeFromSpine(nextHero, nextParent)
    if (!type) return
    const next = snapshotFromType(type.code, self ?? quiz)
    if (!next) return
    saveSelfSnapshot(next)
    onChanged()
  }

  return (
    <details className="stack-fold">
      <summary>Not quite this type?</summary>
      {self && hasPercents(self.percents) ? <PercentBars percents={self.percents} /> : null}
      {self && hasPercents(self.percents) ? (
        <div className="hero__actions">
          <Button type="button" variant="ghost" onClick={onCopy}>
            {copied ? 'Copied' : 'Copy for a friend'}
          </Button>
        </div>
      ) : null}
      <StackPicker
        scores={scores}
        hero={hero}
        parent={parent}
        hideHeading
        preview={
          preview
            ? {
                code: preview.code,
                title: preview.title,
                summary: preview.summary,
                image: preview.image,
              }
            : undefined
        }
        onHeroChange={(next) => applySpine(next, preferredParent(next, scores))}
        onParentChange={(next) => applySpine(hero, next)}
      />
    </details>
  )
}

export function WorkspaceHouse() {
  const location = useLocation()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room>('me')
  const [view, setView] = useState<PeopleView>('list')
  const [whoId, setWhoId] = useState<string | null>(null)
  const [weather, setWeather] = useState<HourWeather | null>(null)
  const [span, setSpan] = useState<HourSpan>('hour')
  const [youSeat, setYouSeat] = useState<number | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const checkoutSettled = useRef(false)
  const [meCopied, setMeCopied] = useState(false)
  const [note, setNote] = useState('')
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [code, setCode] = useState('')
  const [circle, setCircle] = useState<WorkspaceCircle>('household')
  const [mapCircle, setMapCircle] = useState<WorkspaceCircle>('household')
  const [peopleFrom, setPeopleFrom] = useState<'list' | 'map'>('list')
  const [compatLeft, setCompatLeft] = useState(pickMe())
  const [compatRight, setCompatRight] = useState('')
  const house = useHouse()
  const status = useAccountStatus()

  useEffect(() => {
    void hydrateHouse()
  }, [])

  useEffect(() => {
    if (!house) return
    if (house.self) {
      pullQuizPercents()
      return
    }
    const params = new URLSearchParams(location.search)
    if (params.get('checkout') || params.get('account') === '1') return
    const snapshot = loadResultSnapshot()
    if (!snapshot || keepSnapshotWasSkipped(snapshot)) return
    navigate(WORKSPACE_KEEP_PATH, { replace: true })
  }, [house, location.search, navigate])

  useEffect(() => {
    if (!house || checkoutSettled.current) return
    const params = new URLSearchParams(location.search)
    const checkout = params.get('checkout')
    if (checkout !== 'success' && checkout !== 'cancel') return
    checkoutSettled.current = true
    window.history.replaceState({}, '', WORKSPACE_PATH)
    void (async () => {
      if (checkout === 'cancel') markWorkspaceCheckoutCanceled()
      else await settleWorkspaceCheckout(params.get('session_id'))
      setAccountOpen(true)
    })()
  }, [house, location.search])

  useEffect(() => {
    function openAccount() {
      setAccountOpen(true)
    }
    window.addEventListener('jungology:account', openAccount)
    return () => window.removeEventListener('jungology:account', openAccount)
  }, [])

  useEffect(() => {
    if (!house) return
    if (new URLSearchParams(location.search).get('account') !== '1') return
    setAccountOpen(true)
    navigate(WORKSPACE_PATH, { replace: true })
  }, [house, location.search, navigate])

  const people = house?.people ?? []
  const who = people.find((person) => person.id === whoId) ?? null
  const selfType = house?.self ? typeByCode(house.self.code) : undefined
  const copy = weather ? weatherCopy(house?.self ?? null, weather) : null
  const self = house?.self ?? null
  const stackKey = self ? `${self.code}:${self.stack.join(',')}` : 'none'
  const leftPick = resolvePick(compatLeft, self, people)
  const rightPick = resolvePick(compatRight, self, people)

  function closeAccount() {
    setAccountOpen(false)
    if (location.search) navigate(WORKSPACE_PATH, { replace: true })
  }

  function openCompat(right = '') {
    const named = people.find((person) => person.code)
    closeAccount()
    setCompatLeft(pickMe())
    setCompatRight(right || compatRight || (named ? pickPerson(named.id) : ''))
    setRoom('compat')
  }

  if (status === 'unknown') {
    return (
      <section className="section workspace">
        <div className="wrap screen">
          <p className="lede">Opening the account…</p>
        </div>
      </section>
    )
  }

  if (!house) return <Navigate to={WORKSPACE_JOIN_PATH} replace />

  function goToRoom(next: Room) {
    setRoom(next)
    closeAccount()
    setYouSeat(null)
    if (next !== 'journal') setWeather(null)
    if (next === 'library') setView('list')
  }

  function openPerson(id: string, from: 'list' | 'map' = 'list') {
    setWhoId(id)
    setPeopleFrom(from)
    setView('person')
  }

  function onAdd(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const named = code ? typeByCode(code) : undefined
    const houseNext = addPerson({
      name: trimmed,
      relation: relation.trim() || 'Friend',
      source: named ? 'named' : 'invite',
      code: named?.code,
      trigger: '',
      comfort: '',
      inviteToken: crypto.randomUUID().slice(0, 8),
      circle,
    })
    setName('')
    setRelation('')
    setCode('')
    setCircle('household')
    const created = houseNext?.people.at(-1)
    if (created) openPerson(created.id)
  }

  const inviteHref =
    who?.inviteToken && typeof window !== 'undefined'
      ? `${window.location.origin}${QUIZ_PATH}?invite=${who.inviteToken}`
      : ''

  const tiles: { id: HourWeather; title: string; hint: string }[] = self
    ? [
        { id: 'ordinary', title: 'Ordinary', hint: weatherHint(self.stack, 'ordinary') },
        { id: 'loop', title: 'Loop', hint: weatherHint(self.stack, 'loop') },
        { id: 'grip', title: 'Grip', hint: weatherHint(self.stack, 'grip') },
      ]
    : [
        { id: 'ordinary', title: 'Ordinary', hint: 'Hero + Parent' },
        { id: 'loop', title: 'Loop', hint: 'Hero + Child' },
        { id: 'grip', title: 'Grip', hint: 'Inferior' },
      ]

  return (
    <>
      <Seo
        title={`${WORKSPACE_NAME} | Jungology`}
        description="Me, journal, library, and compatibility."
        path="/workspace"
        robots="noindex,nofollow"
      />
      <section className="section workspace">
        <div className="wrap screen">
          {room === 'library' && view === 'list' && !accountOpen ? (
            <>
              <WorkspaceHead title="Library" />
              <p className="lede">People you keep a chart of.</p>
              {people.length ? (
                <ul className="workspace-people">
                  {people.map((person) => {
                    const type = person.code ? typeByCode(person.code) : undefined
                    return (
                      <li key={person.id}>
                        <button
                          type="button"
                          className="workspace-person"
                          onClick={() => openPerson(person.id)}
                        >
                          <span className="workspace-thumb">
                            {type ? (
                              <TypePortrait
                                hero={type.stack[0]}
                                image={type.image}
                                className="sketch--mini"
                                alt=""
                              />
                            ) : (
                              <span className="workspace-thumb__empty" />
                            )}
                          </span>
                          <span className="workspace-person__copy">
                            <span>{person.name}</span>
                            <small>
                              {person.relation}
                              {person.code
                                ? ` · ${person.code}${hasPercents(person.percents) ? ' · quiz' : ''}`
                                : ' · no type yet'}
                            </small>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="note">No one yet.</p>
              )}
              <div className="hero__actions">
                <Button onClick={() => setView('add')}>Add someone</Button>
                {people.length ? (
                  <Button variant="ghost" onClick={() => setView('map')}>
                    Maps
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}

          {room === 'library' && view === 'add' && !accountOpen ? (
            <>
              <WorkspaceHead title="Add" onBack={() => setView('list')} />
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
                    <option value="">I don't know yet</option>
                    {PERSONALITY_TYPES.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.code} · {type.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Household or team
                  <select
                    value={circle}
                    onChange={(event) => setCircle(event.target.value as WorkspaceCircle)}
                  >
                    <option value="household">Household</option>
                    <option value="team">Team</option>
                  </select>
                </label>
                <Button type="submit">Add</Button>
              </form>
            </>
          ) : null}

          {room === 'library' && view === 'map' && !accountOpen ? (
            <>
              <WorkspaceHead title={circleTitle(mapCircle)} onBack={() => setView('list')} />
              <HouseMap
                self={self}
                people={people}
                circle={mapCircle}
                onCircle={setMapCircle}
                onOpenPerson={(id) => openPerson(id, 'map')}
                onOpenMe={() => goToRoom('me')}
                onAdd={() => setView('add')}
              />
            </>
          ) : null}

          {room === 'library' && view === 'person' && who && !accountOpen ? (
            <PersonFile
              person={who}
              inviteHref={inviteHref}
              onBack={() => setView(peopleFrom)}
              onRemoved={() => setView('list')}
              onCompat={
                who.code
                  ? () => openCompat(pickPerson(who.id))
                  : undefined
              }
            />
          ) : null}

          {accountOpen ? (
            <>
              <WorkspaceHead title="Account" onBack={closeAccount} />
              <AccountRoom />
            </>
          ) : null}

          {room === 'me' && !accountOpen ? (
            <>
              {self ? <h1 className="workspace-type">{self.code}</h1> : null}
              {selfType ? <p className="mono-stat">{selfType.title}</p> : null}
              {self && hasPercents(self.percents) ? (
                <p className="lede">
                  The letters are the type you chose. The numbers are the last quiz.
                </p>
              ) : null}
              {self ? (
                <>
                  <div className="workspace-you-hero workspace-you-hero--compact">
                    <TypePortrait
                      hero={self.stack[0]}
                      image={selfType?.image}
                      alt={self.code}
                    />
                  </div>
                  <EightChart
                    key={self.code}
                    stack={self.stack}
                    percents={self.percents}
                    selected={youSeat}
                    onSelect={(index) => setYouSeat((current) => (current === index ? null : index))}
                    caption="My eight seats. Tap a seat."
                  />
                  {hasPercents(self.percents) ? null : (
                    <p className="note">
                      No quiz percentages yet. <Link to={QUIZ_PATH}>Take the quiz</Link>.
                    </p>
                  )}
                </>
              ) : (
                <p className="note">
                  {loadResultSnapshot() ? (
                    <Link to={WORKSPACE_KEEP_PATH} className="stay-free">
                      Keep this type
                    </Link>
                  ) : (
                    <>
                      Pick a lead below, or <Link to={QUIZ_PATH}>take the quiz</Link>.
                    </>
                  )}
                </p>
              )}
              <MeTypeFold
                self={self}
                copied={meCopied}
                onCopy={async () => {
                  if (!self) return
                  try {
                    await navigator.clipboard.writeText(encodeShareLine(self))
                    setMeCopied(true)
                    window.setTimeout(() => setMeCopied(false), 2000)
                  } catch {
                    setMeCopied(false)
                  }
                }}
                onChanged={() => {
                  setYouSeat(null)
                  setWeather(null)
                }}
              />
            </>
          ) : null}

          {room === 'journal' && !accountOpen ? (
            <div key={stackKey}>
              <WorkspaceHead title="Journal" />
              <p className="lede">How is this hour?</p>
              {self ? (
                <p className="mono-stat">
                  {self.code}
                  {selfType ? ` · ${selfType.title}` : ''}
                </p>
              ) : (
                <p className="note">
                  Name a type on Me first. Ordinary, loop, and grip follow that stack.
                </p>
              )}
              <div className="workspace-tiles">
                {tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    className={weather === tile.id ? 'workspace-tile is-on' : 'workspace-tile'}
                    onClick={() => setWeather((current) => (current === tile.id ? null : tile.id))}
                  >
                    <strong>{tile.title}</strong>
                    <span>{tile.hint}</span>
                  </button>
                ))}
              </div>
              {copy ? (
                <div className="cta-band">
                  <p>{copy.learn}</p>
                  <p>
                    <strong>
                      {span === 'day' ? 'This day.' : span === 'minutes' ? 'These minutes.' : 'This hour.'}
                    </strong>{' '}
                    {copy.hour}
                  </p>
                  <p className="workspace-chart__caption">How long</p>
                  <div className="workspace-tiles workspace-tiles--span">
                    {HOUR_SPANS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={span === item.id ? 'workspace-tile is-on' : 'workspace-tile'}
                        onClick={() => setSpan(item.id)}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.hint}</span>
                      </button>
                    ))}
                  </div>
                  <label>
                    Optional note
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="What happened"
                    />
                  </label>
                  <Button
                    onClick={() => {
                      if (!weather) return
                      addHour(weather, note.trim(), self, span)
                      setNote('')
                    }}
                  >
                    {span === 'day'
                      ? 'Keep this day'
                      : span === 'minutes'
                        ? 'Keep these minutes'
                        : 'Keep this hour'}
                  </Button>
                </div>
              ) : (
                <p className="lede">Tap ordinary, loop, or grip. Then how long it lasted.</p>
              )}
              {self && weather ? (
                <EightChart
                  key={self.code}
                  stack={self.stack}
                  percents={self.percents}
                  weather={weather}
                  selected={youSeat}
                  onSelect={(index) => setYouSeat((current) => (current === index ? null : index))}
                  caption={`${copy?.name ?? weather}. Lit seats are who is on stage for ${self.code}.`}
                />
              ) : null}
              {house.hours.length ? (
                <JournalGraph
                  hours={house.hours}
                  selected={weather}
                  onSelect={(next) =>
                    setWeather((current) => (current === next ? null : next))
                  }
                />
              ) : null}
              {house.hours.length ? (
                <ol className="workspace-year">
                  {house.hours.map((tag) => {
                    const hint = tag.hint ?? (self ? weatherHint(self.stack, tag.weather) : undefined)
                    return (
                      <li key={tag.id} data-weather={tag.weather}>
                        <button
                          type="button"
                          className={
                            weather === tag.weather
                              ? 'workspace-year__hit is-on'
                              : 'workspace-year__hit'
                          }
                          onClick={() =>
                            setWeather((current) => (current === tag.weather ? null : tag.weather))
                          }
                        >
                          <span>{formatDay(tag.at)}</span>
                          <strong>{tag.weather}</strong>
                          <span>{spanLabel(tag.span)}</span>
                          <span>{hint}</span>
                          {tag.note ? <em>{tag.note}</em> : null}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              ) : null}
            </div>
          ) : null}

          {room === 'compat' && !accountOpen ? (
            <>
              <WorkspaceHead title="Compare" />
              <p className="lede">
                Pick two. People you've added, or any of the sixteen types.
              </p>
              <div className="workspace-compat-picks">
                <label>
                  This one
                  <select
                    value={compatLeft}
                    onChange={(event) => setCompatLeft(event.target.value)}
                  >
                    <optgroup label="People">
                      <option value={pickMe()} disabled={!self}>
                        Me{self ? ` · ${self.code}` : ''}
                      </option>
                      {people.map((person) => (
                        <option
                          key={person.id}
                          value={pickPerson(person.id)}
                          disabled={!person.code}
                        >
                          {person.name}
                          {person.code ? ` · ${person.code}` : ' · no type yet'}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Types">
                      {PERSONALITY_TYPES.map((type) => (
                        <option key={type.code} value={pickType(type.code)}>
                          {type.code} · {type.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <label>
                  With
                  <select
                    value={compatRight}
                    onChange={(event) => setCompatRight(event.target.value)}
                  >
                    <option value="">Choose</option>
                    <optgroup label="People">
                      <option value={pickMe()} disabled={!self}>
                        Me{self ? ` · ${self.code}` : ''}
                      </option>
                      {people.map((person) => (
                        <option
                          key={person.id}
                          value={pickPerson(person.id)}
                          disabled={!person.code}
                        >
                          {person.name}
                          {person.code ? ` · ${person.code}` : ' · no type yet'}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Types">
                      {PERSONALITY_TYPES.map((type) => (
                        <option key={type.code} value={pickType(type.code)}>
                          {type.code} · {type.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
              </div>
              {leftPick && rightPick ? (
                <CompatPair left={leftPick} right={rightPick} />
              ) : (
                <p className="note">
                  {self
                    ? 'Pick someone or a type on the right.'
                    : 'Name a type on Me, or pick two from the lists.'}
                </p>
              )}
            </>
          ) : null}
        </div>
        <nav className="workspace-rooms" role="tablist" aria-label={WORKSPACE_NAME}>
          <button
            type="button"
            className={room === 'me' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={() => goToRoom('me')}
          >
            Me
          </button>
          <button
            type="button"
            className={room === 'library' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={() => goToRoom('library')}
          >
            Library
          </button>
          <button
            type="button"
            className={room === 'journal' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={() => goToRoom('journal')}
          >
            Journal
          </button>
          <button
            type="button"
            className={room === 'compat' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={() => openCompat()}
          >
            Compare
          </button>
        </nav>
      </section>
    </>
  )
}

function PersonFile({
  person,
  inviteHref,
  onBack,
  onRemoved,
  onCompat,
}: {
  person: WorkspacePerson
  inviteHref: string
  onBack: () => void
  onRemoved: () => void
  onCompat?: () => void
}) {
  const [seat, setSeat] = useState<number | null>(null)
  const [edit, setEdit] = useState(false)
  const [paste, setPaste] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [editName, setEditName] = useState(person.name)
  const [editRelation, setEditRelation] = useState(person.relation)
  const [editCode, setEditCode] = useState(person.code ?? '')
  const [editCircle, setEditCircle] = useState<WorkspaceCircle>(person.circle ?? 'household')

  useEffect(() => {
    setEdit(false)
    setSeat(null)
    setPaste('')
    setPasteError('')
    setLinkCopied(false)
    setEditName(person.name)
    setEditRelation(person.relation)
    setEditCode(person.code ?? '')
    setEditCircle(person.circle ?? 'household')
  }, [person.id, person.name, person.relation, person.code, person.circle])

  useEffect(() => {
    if (person.inviteToken) return
    updatePerson(person.id, { inviteToken: crypto.randomUUID().slice(0, 8) })
  }, [person.id, person.inviteToken])

  const them = person.code ? typeByCode(person.code) : undefined

  return (
    <>
      <WorkspaceHead
        title={person.name}
        onBack={onBack}
        editing={edit}
        onEdit={() => {
          setEditName(person.name)
          setEditRelation(person.relation)
          setEditCode(person.code ?? '')
          setEditCircle(person.circle ?? 'household')
          setEdit((current) => !current)
        }}
      />
      {edit ? (
        <form
          className="workspace-add"
          onSubmit={(event) => {
            event.preventDefault()
            const trimmed = editName.trim()
            if (!trimmed) return
            const named = editCode ? typeByCode(editCode) : undefined
            updatePerson(person.id, {
              name: trimmed,
              relation: editRelation.trim() || 'Friend',
              source: named ? 'named' : 'invite',
              code: named?.code,
              percents: person.percents,
              inviteToken: person.inviteToken ?? crypto.randomUUID().slice(0, 8),
              circle: editCircle,
            })
            setEdit(false)
          }}
        >
          <label>
            Name
            <input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              required
            />
          </label>
          <label>
            Who they are to you
            <input
              value={editRelation}
              onChange={(event) => setEditRelation(event.target.value)}
              placeholder="Partner, mother, friend"
            />
          </label>
          <label>
            Their type
            <select value={editCode} onChange={(event) => setEditCode(event.target.value)}>
              <option value="">I don't know yet</option>
              {PERSONALITY_TYPES.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.code} · {type.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Household or team
            <select
              value={editCircle}
              onChange={(event) => setEditCircle(event.target.value as WorkspaceCircle)}
            >
              <option value="household">Household</option>
              <option value="team">Team</option>
            </select>
          </label>
          <Button type="submit">Save</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!window.confirm(`Remove ${person.name} from the library?`)) return
              removePerson(person.id)
              onRemoved()
            }}
          >
            Remove from library
          </Button>
        </form>
      ) : null}
      <p className="mono-stat">
        {person.relation}
        {person.code ? ` · ${person.code}` : ''}
        {them ? ` · ${them.title}` : ''}
      </p>
      {them ? (
        <div className="workspace-you-hero workspace-you-hero--compact">
          <TypePortrait hero={them.stack[0]} image={them.image} alt={them.code} />
        </div>
      ) : null}
      {onCompat || inviteHref ? (
        <div className="hero__actions">
          {onCompat ? <Button onClick={onCompat}>Compare</Button> : null}
          {inviteHref ? (
            <Button
              type="button"
              variant={onCompat ? 'ghost' : undefined}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteHref)
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
        </div>
      ) : null}
      <p className="lede">
        Send them the quiz. They copy percentages from Results, then you paste that line here.
      </p>
      <form
        className="workspace-add"
        onSubmit={(event) => {
          event.preventDefault()
          const snapshot = snapshotFromShare(paste)
          if (!snapshot) {
            setPasteError('Need a type and the eight percentages. Not the answers.')
            return
          }
          applyPersonSnapshot(person.id, snapshot)
          setPaste('')
          setPasteError('')
          setSeat(null)
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
        <Button type="submit">Keep these percentages</Button>
      </form>
      {them ? (
        <EightChart
          key={them.code}
          stack={them.stack}
          percents={person.percents}
          selected={seat}
          onSelect={(index) => setSeat((current) => (current === index ? null : index))}
          caption={`${person.name}'s eight seats. Tap a seat.`}
        />
      ) : null}
      {hasPercents(person.percents) ? <PercentBars percents={person.percents} /> : null}
      {them ? null : (
        <p className="note">Name their type with Edit, or paste percentages.</p>
      )}
      <div className="workspace-file">
        <label>
          Notes
          <textarea
            value={person.trigger}
            onChange={(event) => updatePerson(person.id, { trigger: event.target.value })}
            rows={3}
            placeholder="What you notice"
          />
        </label>
        <label>
          Remember
          <textarea
            value={person.comfort}
            onChange={(event) => updatePerson(person.id, { comfort: event.target.value })}
            rows={3}
            placeholder="What you want to keep about them"
          />
        </label>
      </div>
    </>
  )
}
