import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import { StackPicker } from '../components/StackPicker'
import { TypePortrait } from '../components/TypePortrait'
import { AccountRoom, WorkspacePaywall } from '../components/workspace/AccountRoom'
import { CompatPair } from '../components/workspace/CompatPair'
import { FirstWeek } from '../components/workspace/FirstWeek'
import { EightChart } from '../components/workspace/EightChart'
import { HouseMap } from '../components/workspace/HouseMap'
import { JournalGraph } from '../components/workspace/JournalGraph'
import { PercentBars } from '../components/workspace/PercentBars'
import {
  alreadyInLibrary,
  groupedFigures,
  matchFigures,
  type FigureKind,
  type PublicFigure,
} from '../data/figures'
import { FUNCTION_IDS, type FunctionId } from '../data/functions'
import { PERSONALITY_TYPES, typeByCode } from '../data/personalityTypes'
import { preferredParent } from '../lib/scoring'
import { FIGURES, groupTitle, groupsOf, isFigure, personGroupId } from '../lib/workspace/circle'
import { offeringFirstWeek } from '../lib/workspace/firstWeek'
import { pickMe, pickPerson, pickType, resolvePick } from '../lib/workspace/compatPick'
import { QUIZ_PATH } from '../lib/quizPath'
import {
  markWorkspaceCheckoutCanceled,
  settleWorkspaceCheckout,
  takeCheckoutNote,
} from '../lib/workspace/checkout'
import {
  WORKSPACE_JOIN_PATH,
  WORKSPACE_KEEP_PATH,
  WORKSPACE_NAME,
  WORKSPACE_PATH,
  workspaceUnlocked,
} from '../lib/workspace/offered'
import { readInviteSnapshot } from '../lib/workspace/inviteClient'
import { inviteQuizHref, newInviteToken } from '../lib/workspace/invitePacket'
import {
  INVITE_WATCH_MS,
  armInvitePing,
  armPendingInvitePings,
  askToPingThisDevice,
  latestUnseenPing,
  pendingInvitePeople,
  pingForPerson,
  pingThisDevice,
  pullInviteArrivals,
  unseenPings,
} from '../lib/workspace/inviteWatch'
import { encodeShareLine, hasPercents, snapshotFromShare } from '../lib/workspace/sharePacket'
import { loadResultSnapshot, snapshotFromType } from '../lib/workspace/snapshot'
import {
  addHour,
  addPerson,
  applyPersonSnapshot,
  dismissPing,
  finishFirstWeek,
  hydrateHouse,
  keepInviteArrival,
  keepSnapshotWasSkipped,
  loadHouse,
  pullQuizPercents,
  removePerson,
  renameGroup,
  saveSelfSnapshot,
  skipFirstWeek,
  updatePerson,
  useAccountStatus,
  useHouse,
} from '../lib/workspace/store'
import type { HourSpan, HourWeather, ResultSnapshot, WorkspacePerson } from '../lib/workspace/types'
import { HOUR_SPANS, spanLabel, weatherCopy, weatherHint } from '../lib/workspace/weather'

type Room = 'me' | 'journal' | 'library' | 'compat'
type PeopleView = 'list' | 'person' | 'add' | 'map' | 'figures'

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
  const [billingNote, setBillingNote] = useState('')
  const [claimingStripe, setClaimingStripe] = useState(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return params.get('session_id')?.startsWith('cs_') || params.get('checkout') === 'success'
  })
  const [meCopied, setMeCopied] = useState(false)
  const [note, setNote] = useState('')
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [code, setCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [mapCircle, setMapCircle] = useState('')
  const [peopleFrom, setPeopleFrom] = useState<'list' | 'map'>('list')
  const [compatLeft, setCompatLeft] = useState(pickMe())
  const [compatRight, setCompatRight] = useState('')
  const house = useHouse()
  const status = useAccountStatus()
  const pendingKey = house
    ? pendingInvitePeople(house)
        .map((person) => `${person.id}:${person.inviteToken ?? ''}`)
        .join(',')
    : ''

  useEffect(() => {
    if (!house || !workspaceUnlocked(house)) return
    armPendingInvitePings(house)
    if (!pendingKey) return
    let cancelled = false
    async function tick() {
      const latest = loadHouse()
      if (!latest) return
      const arrivals = await pullInviteArrivals(pendingInvitePeople(latest))
      if (cancelled || !arrivals.length) return
      for (const item of arrivals) {
        keepInviteArrival(item.person.id, item.snapshot)
        pingThisDevice(item.person.name, item.snapshot.code)
      }
    }
    void tick()
    const timer = window.setInterval(() => void tick(), INVITE_WATCH_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [house, pendingKey])

  useEffect(() => {
    if (!house) return
    const groups = groupsOf(house)
    if (!groups.length) return
    setMapCircle((current) => (groups.some((group) => group.id === current) ? current : groups[0].id))
  }, [house])

  useEffect(() => {
    void hydrateHouse()
  }, [])

  useEffect(() => {
    if (!house || !workspaceUnlocked(house)) return
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
    if (checkoutSettled.current) return
    const params = new URLSearchParams(location.search)
    const checkout = params.get('checkout')
    const sessionId = params.get('session_id')
    if (checkout === 'cancel') {
      checkoutSettled.current = true
      setClaimingStripe(false)
      markWorkspaceCheckoutCanceled()
      setBillingNote(takeCheckoutNote())
      navigate(WORKSPACE_PATH, { replace: true })
      return
    }
    const fromStripe = checkout === 'success' || Boolean(sessionId?.startsWith('cs_'))
    if (!fromStripe) {
      if (!house || workspaceUnlocked(house)) return
      checkoutSettled.current = true
      void (async () => {
        const ok = await settleWorkspaceCheckout(null, { quiet: true })
        setBillingNote(takeCheckoutNote())
        if (ok) navigate(WORKSPACE_PATH, { replace: true })
      })()
      return
    }
    checkoutSettled.current = true
    void (async () => {
      const ok = await settleWorkspaceCheckout(sessionId)
      setBillingNote(takeCheckoutNote())
      setClaimingStripe(false)
      if (ok) navigate(WORKSPACE_PATH, { replace: true })
    })()
  }, [house, location.search, navigate])

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

  if (status === 'unknown' || claimingStripe) {
    return (
      <section className="section workspace">
        <div className="wrap screen">
          <p className="lede">
            {claimingStripe ? 'Opening your account from Stripe…' : 'Opening the account…'}
          </p>
          {billingNote ? <p className="note">{billingNote}</p> : null}
        </div>
      </section>
    )
  }

  if (!house) {
    if (billingNote) {
      return (
        <section className="section workspace">
          <div className="wrap screen">
            <p className="lede">{billingNote}</p>
            <Button to={WORKSPACE_JOIN_PATH}>Back to join</Button>
          </div>
        </section>
      )
    }
    return <Navigate to={WORKSPACE_JOIN_PATH} replace />
  }

  if (!workspaceUnlocked(house)) {
    return (
      <>
        <Seo
          title={`${WORKSPACE_NAME} | Jungology`}
          description="Start the 7-day trial to open Me, journal, library, and compare."
          path="/workspace"
          robots="noindex,nofollow"
        />
        <section className="section workspace">
          <WorkspacePaywall note={billingNote} />
        </section>
      </>
    )
  }

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
      inviteToken: newInviteToken(),
      circle: groupName.trim() || undefined,
    })
    setName('')
    setRelation('')
    setCode('')
    setGroupName('')
    const created = houseNext?.people.at(-1)
    if (created && !named) armInvitePing(created.inviteToken, created.name, houseNext?.email)
    if (created) openPerson(created.id)
  }

  const friends = people.filter((person) => !isFigure(person))
  const figures = people.filter(isFigure)
  const namedGroups = groupsOf(house)
  const firstWeekOpen = offeringFirstWeek(house) && !accountOpen
  const ping = latestUnseenPing(house)
  const libraryPing = unseenPings(house).length > 0
  const inviteHref =
    who && !isFigure(who) && who.inviteToken && typeof window !== 'undefined'
      ? inviteQuizHref(window.location.origin, who.inviteToken)
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
          {ping && !firstWeekOpen && !accountOpen ? (
            <div className="workspace-ping" role="status">
              <p>
                {ping.name} sent {ping.code}.
              </p>
              <div className="hero__actions">
                <Button
                  onClick={() => {
                    dismissPing(ping.id)
                    openCompat(pickPerson(ping.personId))
                  }}
                >
                  Compare
                </Button>
                <Button type="button" variant="ghost" onClick={() => dismissPing(ping.id)}>
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
          {firstWeekOpen ? (
            <FirstWeek
              house={house}
              onSkip={() => skipFirstWeek()}
              onCompare={(id) => {
                finishFirstWeek()
                openCompat(pickPerson(id))
              }}
            />
          ) : null}
          {firstWeekOpen || accountOpen ? null : room === 'library' && view === 'list' ? (
            <>
              <WorkspaceHead title="Library" />
              <p className="lede">People you keep a chart of, and public figures you have named.</p>
              {friends.length ? (
                <ul className="workspace-people">
                  {friends.map((person) => (
                    <PersonRow
                      key={person.id}
                      person={person}
                      ping={Boolean(pingForPerson(house, person.id))}
                      onOpen={() => openPerson(person.id)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="note">No one yet.</p>
              )}
              {figures.length ? (
                <>
                  <p className="workspace-people__kicker">Public figures</p>
                  <ul className="workspace-people">
                    {figures.map((person) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        onOpen={() => openPerson(person.id)}
                      />
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="hero__actions">
                <Button onClick={() => setView('add')}>Add someone</Button>
                <Button variant="ghost" onClick={() => setView('figures')}>
                  Add a public figure
                </Button>
                {friends.length ? (
                  <Button variant="ghost" onClick={() => setView('map')}>
                    Maps
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}

          {room === 'library' && view === 'add' && !accountOpen && !firstWeekOpen ? (
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
                  Group
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    list="workspace-groups"
                    placeholder="Family, work, band"
                  />
                </label>
                <datalist id="workspace-groups">
                  {namedGroups.map((group) => (
                    <option key={group.id} value={group.name} />
                  ))}
                </datalist>
                <Button type="submit">Add</Button>
              </form>
            </>
          ) : null}

          {room === 'library' && view === 'figures' && !accountOpen && !firstWeekOpen ? (
            <AddFigure
              people={people}
              onBack={() => setView('list')}
              onKeep={(id) => openPerson(id)}
            />
          ) : null}

          {room === 'library' && view === 'map' && !accountOpen && !firstWeekOpen ? (
            <>
              <WorkspaceHead title="Maps" onBack={() => setView('list')} />
              <HouseMap
                self={self}
                people={people}
                groups={namedGroups}
                circle={mapCircle}
                onCircle={setMapCircle}
                onRename={renameGroup}
                onOpenPerson={(id) => openPerson(id, 'map')}
                onOpenMe={() => goToRoom('me')}
                onAdd={() => setView('add')}
              />
            </>
          ) : null}

          {room === 'library' && view === 'person' && who && !accountOpen && !firstWeekOpen ? (
            <PersonFile
              person={who}
              groups={namedGroups}
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

          {room === 'me' && !accountOpen && !firstWeekOpen ? (
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

          {room === 'journal' && !accountOpen && !firstWeekOpen ? (
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

          {room === 'compat' && !accountOpen && !firstWeekOpen ? (
            <>
              <WorkspaceHead title="Compare" />
              <p className="lede">
                Pick two. People you've added, public figures, or any of the sixteen types.
              </p>
              <div className="workspace-compat-picks">
                <label>
                  This one
                  <select
                    value={compatLeft}
                    onChange={(event) => setCompatLeft(event.target.value)}
                  >
                    <CompareOptions self={self} friends={friends} figures={figures} />
                  </select>
                </label>
                <label>
                  With
                  <select
                    value={compatRight}
                    onChange={(event) => setCompatRight(event.target.value)}
                  >
                    <option value="">Choose</option>
                    <CompareOptions self={self} friends={friends} figures={figures} />
                  </select>
                </label>
                <button
                  type="button"
                  className="workspace-compat-swap"
                  onClick={() => {
                    const nextLeft = compatRight || pickMe()
                    setCompatRight(compatLeft)
                    setCompatLeft(nextLeft)
                  }}
                >
                  Swap
                </button>
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
        {firstWeekOpen ? null : (
        <nav className="workspace-rooms" role="tablist" aria-label={WORKSPACE_NAME}>
          <button
            type="button"
            role="tab"
            aria-selected={room === 'me'}
            className={room === 'me' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={(event) => {
              goToRoom('me')
              event.currentTarget.blur()
            }}
          >
            Me
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={room === 'library'}
            className={room === 'library' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={(event) => {
              goToRoom('library')
              event.currentTarget.blur()
            }}
          >
            Library{libraryPing ? <span className="workspace-rooms__dot" aria-hidden="true" /> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={room === 'journal'}
            className={room === 'journal' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={(event) => {
              goToRoom('journal')
              event.currentTarget.blur()
            }}
          >
            Journal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={room === 'compat'}
            className={room === 'compat' ? 'btn btn--primary' : 'btn btn--ghost'}
            onClick={(event) => {
              openCompat()
              event.currentTarget.blur()
            }}
          >
            Compare
          </button>
        </nav>
        )}
      </section>
    </>
  )
}

function PersonFile({
  person,
  groups,
  inviteHref,
  onBack,
  onRemoved,
  onCompat,
}: {
  person: WorkspacePerson
  groups: { id: string; name: string }[]
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
  const [lookNote, setLookNote] = useState('')
  const [lookBusy, setLookBusy] = useState(false)
  const [editName, setEditName] = useState(person.name)
  const [editRelation, setEditRelation] = useState(person.relation)
  const [editCode, setEditCode] = useState(person.code ?? '')
  const [editCircle, setEditCircle] = useState(
    isFigure(person) ? 'Public figures' : groupTitle(personGroupId(person), groups),
  )
  const figure = isFigure(person)

  useEffect(() => {
    setEdit(false)
    setSeat(null)
    setPaste('')
    setPasteError('')
    setLinkCopied(false)
    setLookNote('')
  }, [person.id])

  useEffect(() => {
    setEditName(person.name)
    setEditRelation(person.relation)
    setEditCode(person.code ?? '')
    setEditCircle(isFigure(person) ? 'Public figures' : groupTitle(personGroupId(person), groups))
  }, [groups, person.id, person.name, person.relation, person.code, person.circle])

  useEffect(() => {
    if (figure || person.inviteToken) return
    updatePerson(person.id, { inviteToken: newInviteToken() })
  }, [figure, person.id, person.inviteToken])

  useEffect(() => {
    if (figure || !person.inviteToken || person.code) return
    let cancelled = false
    void readInviteSnapshot(person.inviteToken).then((result) => {
      if (cancelled || !result.ok || !result.snapshot) return
      applyPersonSnapshot(person.id, result.snapshot)
    })
    return () => {
      cancelled = true
    }
  }, [figure, person.id, person.inviteToken, person.code])

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
          setEditCircle(isFigure(person) ? 'Public figures' : groupTitle(personGroupId(person), groups))
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
            const nextCircle = /^public figures$/i.test(editCircle.trim()) ? FIGURES : editCircle.trim()
            updatePerson(person.id, {
              name: trimmed,
              relation: editRelation.trim() || 'Friend',
              source: named ? 'named' : 'invite',
              code: named?.code,
              percents: person.percents,
              inviteToken:
                nextCircle === FIGURES ? undefined : person.inviteToken ?? newInviteToken(),
              circle: nextCircle || undefined,
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
            Group
            <input
              value={editCircle}
              onChange={(event) => setEditCircle(event.target.value)}
              list="workspace-person-groups"
              placeholder="Family, work, band"
            />
          </label>
          <datalist id="workspace-person-groups">
            {groups.map((group) => (
              <option key={group.id} value={group.name} />
            ))}
            <option value="Public figures" />
          </datalist>
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
      {onCompat || (!figure && inviteHref) ? (
        <div className="hero__actions">
          {onCompat ? <Button onClick={onCompat}>Compare</Button> : null}
          {!figure && inviteHref ? (
            <Button
              type="button"
              variant={onCompat ? 'ghost' : undefined}
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
          {!figure && person.inviteToken ? (
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
                applyPersonSnapshot(person.id, result.snapshot)
                setLookNote(`Kept ${result.snapshot.code}.`)
              }}
            >
              {lookBusy ? 'Looking…' : 'Look for their result'}
            </Button>
          ) : null}
        </div>
      ) : null}
      {figure ? <p className="lede">Named type. Not a quiz.</p> : null}
      {lookNote && !figure ? <p className="note">{lookNote}</p> : null}
      {figure ? null : (
        <>
          <p className="lede">
            Send them the quiz link. They send their type and eight percentages from Results. You can also paste a line here.
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
        </>
      )}
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
      {them || figure ? null : (
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

function PersonRow({
  person,
  ping,
  onOpen,
}: {
  person: WorkspacePerson
  ping?: boolean
  onOpen: () => void
}) {
  const type = person.code ? typeByCode(person.code) : undefined
  return (
    <li>
      <button type="button" className={ping ? 'workspace-person workspace-person--ping' : 'workspace-person'} onClick={onOpen}>
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
            {ping
              ? ` · sent ${person.code}`
              : person.code
              ? ` · ${person.code}${hasPercents(person.percents) && !isFigure(person) ? ' · quiz' : ''}`
              : ' · waiting on quiz'}
          </small>
        </span>
      </button>
    </li>
  )
}

function AddFigure({
  people,
  onBack,
  onKeep,
}: {
  people: WorkspacePerson[]
  onBack: () => void
  onKeep: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Partial<Record<FigureKind, boolean>>>({})
  const listed = matchFigures(query)
  const searching = Boolean(query.trim())

  function keep(figure: PublicFigure) {
    const existing = people.find(
      (person) => person.name.trim().toLowerCase() === figure.name.trim().toLowerCase(),
    )
    if (existing) {
      onKeep(existing.id)
      return
    }
    const named = typeByCode(figure.code)
    if (!named) return
    const houseNext = addPerson({
      name: figure.name,
      relation: figure.role,
      source: 'named',
      code: named.code,
      trigger: '',
      comfort: '',
      circle: 'figures',
    })
    const created = houseNext?.people.at(-1)
    if (created) onKeep(created.id)
  }

  return (
    <>
      <WorkspaceHead title="Public figures" onBack={onBack} />
      <p className="lede">People, fiction, and anime. Named types. Not a quiz.</p>
      <div className="workspace-add">
        <label>
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, story, anime, or type"
          />
        </label>
      </div>
      {listed.length ? (
        groupedFigures(listed).map((group) => (
          <details
            key={group.kind}
            className="workspace-figure-fold"
            open={searching || Boolean(open[group.kind])}
            onToggle={(event) => {
              if (searching) return
              setOpen((current) => ({
                ...current,
                [group.kind]: event.currentTarget.open,
              }))
            }}
          >
            <summary>
              {group.label} · {group.items.length}
            </summary>
            <ul className="workspace-people">
              {group.items.map((figure) => {
                const type = typeByCode(figure.code)
                const kept = alreadyInLibrary(people, figure)
                return (
                  <li key={figure.name}>
                    <button type="button" className="workspace-person" onClick={() => keep(figure)}>
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
                        <span>{figure.name}</span>
                        <small>
                          {figure.role} · {figure.code}
                          {kept ? ' · in library' : ''}
                        </small>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </details>
        ))
      ) : (
        <p className="note">No one by that name.</p>
      )}
    </>
  )
}

function CompareOptions({
  self,
  friends,
  figures,
}: {
  self: ResultSnapshot | null
  friends: WorkspacePerson[]
  figures: WorkspacePerson[]
}) {
  return (
    <>
      <optgroup label="People">
        <option value={pickMe()} disabled={!self}>
          Me{self ? ` · ${self.code}` : ''}
        </option>
        {friends.map((person) => (
          <option key={person.id} value={pickPerson(person.id)} disabled={!person.code}>
            {person.name}
            {person.code ? ` · ${person.code}` : ' · no type yet'}
          </option>
        ))}
      </optgroup>
      {figures.length ? (
        <optgroup label="Public figures">
          {figures.map((person) => (
            <option key={person.id} value={pickPerson(person.id)} disabled={!person.code}>
              {person.name}
              {person.code ? ` · ${person.code}` : ''}
            </option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label="Types">
        {PERSONALITY_TYPES.map((type) => (
          <option key={type.code} value={pickType(type.code)}>
            {type.code} · {type.title}
          </option>
        ))}
      </optgroup>
    </>
  )
}
