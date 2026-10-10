import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import followupSeed from '../content/followup.json'
import questionsSeed from '../content/questions.json'
import type { FollowupContent, QuestionsContent } from '../content/schema'
import { FUNCTION_IDS, FUNCTIONS, type FunctionId } from '../data/functions'
import type { QuestionFacet } from '../data/questions'
import { Button } from '../components/Button'
import { EditGate } from '../components/EditBar'
import { Seo } from '../components/Seo'
import {
  downloadJson,
  fetchCmsStatus,
  getCmsPassword,
  saveCmsFile,
  type CmsStatus,
} from '../lib/cms'
import { fetchTypeCensus } from '../lib/typeCensus'
import type { CensusSnapshot } from '../lib/typeCensusShared'
import { PERSONALITY_TYPES } from '../data/personalityTypes'
import { useEditMode } from '../lib/editMode'

type Tab = 'quiz' | 'followup' | 'census'

const FACETS: QuestionFacet[] = ['orientation', 'criterion', 'process', 'reverse']

function clone<T>(value: T): T {
  return structuredClone(value)
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Admin() {
  const edit = useEditMode()
  const navigate = useNavigate()
  const [status, setStatus] = useState<CmsStatus | null>(null)
  const [tab, setTab] = useState<Tab>('quiz')
  const [questions, setQuestions] = useState<QuestionsContent>(
    () => clone(questionsSeed as QuestionsContent),
  )
  const [followup, setFollowup] = useState<FollowupContent>(
    () => clone(followupSeed as FollowupContent),
  )
  const [functionId, setFunctionId] = useState<FunctionId>('Ni')
  const [pairKey, setPairKey] = useState('Ni-Ne')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [census, setCensus] = useState<(CensusSnapshot & { configured: boolean }) | null>(null)
  const [censusError, setCensusError] = useState('')

  useEffect(() => {
    const password = getCmsPassword()
    if (password) {
      void fetchTypeCensus(password)
        .then(setCensus)
        .catch((error) => setCensusError(error instanceof Error ? error.message : 'Census unavailable'))
    }
    void fetchCmsStatus().then(setStatus)
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex, nofollow')
  }, [])

  const pairKeys = useMemo(() => {
    return [...Object.keys(followup.attitude), ...Object.keys(followup.rival)]
  }, [followup])

  const pairBank = followup.attitude[pairKey] ? 'attitude' : 'rival'
  const [left = 'A', right = 'B'] = pairKey.split('-')

  if (!edit.editing && !census) {
    return (
      <article className="section">
        <Seo
          title="Edit | Jung Functions Quiz"
          description="Unlock in-place editing of the live pages."
          path="/admin"
        />
        <div className="wrap narrow cms">
          <p className="eyebrow">local editor</p>
          <h1 className="serif-title">Edit the site</h1>
          <p className="lede">
            Enter the password to edit wording where it sits on the pages, or to open the type
            census. Saving copy still needs <code>npm run dev</code> on this computer.
          </p>
          <EditGate
            onUnlocked={() => navigate('/')}
            onCensus={(snapshot) => {
              setCensus(snapshot)
              setCensusError('')
            }}
          />
          {censusError ? <p className="cms-status">{censusError}</p> : null}
        </div>
      </article>
    )
  }

  if (!edit.editing && census) {
    return (
      <article className="section">
        <Seo
          title="Type census | Jung Functions Quiz"
          description="How often the quiz suggests each type."
          path="/admin"
        />
        <div className="wrap cms">
          <p className="eyebrow">type census</p>
          <h1 className="serif-title">How the quiz is typing</h1>
          <p className="lede">
            Counts only. Answers stay in the browser. Page editing still needs a local
            <code> npm run dev</code>.
          </p>
          <CensusPanel snapshot={census} error={censusError} />
        </div>
      </article>
    )
  }

  async function saveCurrent() {
    setBusy(true)
    setMessage('')
    try {
      const password = getCmsPassword()
      if (tab === 'quiz') {
        const next = clone(questions)
        for (const id of FUNCTION_IDS) {
          next[id] = next[id].map((item) => ({
            ...item,
            functionId: id,
            reverse: item.facet === 'reverse' ? true : undefined,
          }))
        }
        await saveCmsFile('questions', next, password)
        setQuestions(next)
      } else {
        await saveCmsFile('followup', followup, password)
      }
      setMessage('Saved on this computer. jungology.com updates after a git push.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="section">
      <Seo
        title="Quiz items | Jung Functions Quiz"
        description="Edit quiz statements and follow-up questions."
        path="/admin"
      />
      <div className="wrap cms">
        <p className="eyebrow">local editor</p>
        <h1 className="serif-title">Quiz items</h1>
        <p className="lede">
          Page copy is edited on the live pages. This screen is only for the quiz statements
          and the follow-up pairs.{' '}
          <Link to="/">Go click the wording on the site</Link>.
        </p>
        {!status?.writable ? (
          <p className="cms-note">
            This build cannot write files. Open this page while the site is running locally.
          </p>
        ) : null}

        <div className="cms-tabs" role="tablist" aria-label="Quiz content">
          {(
            [
              ['quiz', 'Quiz questions'],
              ['followup', 'Follow-up'],
              ['census', 'Type census'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'is-active' : undefined}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'quiz' ? (
          <QuizEditor
            questions={questions}
            setQuestions={setQuestions}
            functionId={functionId}
            setFunctionId={setFunctionId}
          />
        ) : tab === 'followup' ? (
          <FollowupEditor
            followup={followup}
            setFollowup={setFollowup}
            pairKey={pairKey}
            setPairKey={setPairKey}
            pairKeys={pairKeys}
            pairBank={pairBank}
            left={left}
            right={right}
          />
        ) : (
          <CensusPanel snapshot={census} error={censusError} />
        )}

        {tab !== 'census' ? (
          <div className="cms-toolbar">
            <Button type="button" disabled={busy || !status?.writable} onClick={() => void saveCurrent()}>
              {busy ? 'Saving…' : 'Save quiz items'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                downloadJson(tab === 'quiz' ? 'questions.json' : 'followup.json', tab === 'quiz' ? questions : followup)
              }
            >
              Download JSON
            </Button>
          </div>
        ) : null}
        {message ? <p className="cms-status">{message}</p> : null}
      </div>
    </article>
  )
}

function QuizEditor({
  questions,
  setQuestions,
  functionId,
  setFunctionId,
}: {
  questions: QuestionsContent
  setQuestions: (questions: QuestionsContent) => void
  functionId: FunctionId
  setFunctionId: (id: FunctionId) => void
}) {
  const items = questions[functionId]

  return (
    <div className="cms-panel">
      <p className="cms-note">
        Each function keeps six statements, and the last one should stay reverse-keyed so the
        scoring still balances. The id stays the same even if you change the wording, so answers
        already stored in a browser still match.
      </p>
      <div className="cms-chips" role="tablist" aria-label="Function">
        {FUNCTION_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={functionId === id ? 'is-active' : undefined}
            onClick={() => setFunctionId(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <p className="cms-subhead">
        {FUNCTIONS[functionId].name} — {FUNCTIONS[functionId].role}
      </p>
      {items.map((item, index) => (
        <fieldset key={`${functionId}-${index}`} className="cms-card">
          <legend>{`q-${functionId}-${index + 1}`}</legend>
          <Field label="Facet">
            <select
              value={item.facet}
              onChange={(event) => {
                const facet = event.target.value as QuestionFacet
                setQuestions({
                  ...questions,
                  [functionId]: items.map((entry, entryIndex) =>
                    entryIndex === index
                      ? { ...entry, facet, reverse: facet === 'reverse' ? true : undefined }
                      : entry,
                  ),
                })
              }}
            >
              {FACETS.map((facet) => (
                <option key={facet} value={facet}>
                  {facet}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statement">
            <textarea
              rows={4}
              value={item.text}
              onChange={(event) => {
                setQuestions({
                  ...questions,
                  [functionId]: items.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, text: event.target.value } : entry,
                  ),
                })
              }}
            />
          </Field>
        </fieldset>
      ))}
    </div>
  )
}

function FollowupEditor({
  followup,
  setFollowup,
  pairKey,
  setPairKey,
  pairKeys,
  pairBank,
  left,
  right,
}: {
  followup: FollowupContent
  setFollowup: (followup: FollowupContent) => void
  pairKey: string
  setPairKey: (key: string) => void
  pairKeys: string[]
  pairBank: 'attitude' | 'rival'
  left: string
  right: string
}) {
  const items = followup[pairBank][pairKey] ?? []

  return (
    <div className="cms-panel">
      <p className="cms-note">
        These are the forced-choice items used when two functions land close together. The first
        option is {left}; the second is {right}.
      </p>
      <div className="cms-chips" role="tablist" aria-label="Follow-up pair">
        {pairKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={pairKey === key ? 'is-active' : undefined}
            onClick={() => setPairKey(key)}
          >
            {key}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <fieldset key={`${pairKey}-${index}`} className="cms-card">
          <legend>Item {index + 1}</legend>
          <Field label="Prompt">
            <input
              value={item.prompt}
              onChange={(event) => {
                const nextItems = items.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, prompt: event.target.value } : entry,
                )
                setFollowup({
                  ...followup,
                  [pairBank]: { ...followup[pairBank], [pairKey]: nextItems },
                })
              }}
            />
          </Field>
          <Field label={`${left} choice`}>
            <textarea
              rows={3}
              value={item.aText}
              onChange={(event) => {
                const nextItems = items.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, aText: event.target.value } : entry,
                )
                setFollowup({
                  ...followup,
                  [pairBank]: { ...followup[pairBank], [pairKey]: nextItems },
                })
              }}
            />
          </Field>
          <Field label={`${right} choice`}>
            <textarea
              rows={3}
              value={item.bText}
              onChange={(event) => {
                const nextItems = items.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, bText: event.target.value } : entry,
                )
                setFollowup({
                  ...followup,
                  [pairBank]: { ...followup[pairBank], [pairKey]: nextItems },
                })
              }}
            />
          </Field>
        </fieldset>
      ))}
    </div>
  )
}

function CensusPanel({
  snapshot,
  error,
}: {
  snapshot: (CensusSnapshot & { configured?: boolean }) | null
  error: string
}) {
  if (error && !snapshot) {
    return <p className="cms-note">{error}</p>
  }
  if (!snapshot) {
    return (
      <p className="cms-note">
        No census yet. Finish a quiz on this computer while <code>npm run dev</code> is running, or
        bind a Cloudflare KV namespace named <code>TYPE_CENSUS</code> on the live site.
      </p>
    )
  }

  const thin = snapshot.total < 40
  const rows = PERSONALITY_TYPES.map((type) => {
    const suggested = snapshot.suggested[type.code] ?? 0
    const selected = snapshot.selected[type.code] ?? 0
    const observed = snapshot.total ? (suggested / snapshot.total) * 100 : 0
    const expected = type.populationPercent
    const ratio = expected > 0 ? observed / expected : 0
    let flag = '—'
    if (!thin && expected > 0) {
      if (ratio >= 2.5) flag = 'over'
      else if (ratio <= 0.4) flag = 'under'
      else flag = 'ok'
    }
    return { type, suggested, selected, observed, expected, ratio, flag }
  }).sort((a, b) => b.ratio - a.ratio || b.suggested - a.suggested)

  return (
    <div className="cms-panel">
      <p className="cms-note">
        {snapshot.total} completed quizzes. Suggested is what the model named first. Selected is
        the stack on the results page, including a Hero / Heroine change. Sample share is the
        published population figure, not this quiz’s own history.
        {thin ? ' Need about forty results before over/under is worth reading.' : ''}
      </p>
      <div className="census-table-wrap">
        <table className="census-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Suggested</th>
              <th>Quiz %</th>
              <th>Sample %</th>
              <th>Ratio</th>
              <th>Flag</th>
              <th>Selected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.type.code} data-flag={row.flag}>
                <td>
                  <strong>{row.type.code}</strong>
                  <span className="census-table__title">{row.type.title}</span>
                </td>
                <td>{row.suggested}</td>
                <td>{row.observed.toFixed(1)}</td>
                <td>{row.expected.toFixed(1)}</td>
                <td>{row.ratio ? row.ratio.toFixed(1) : '—'}</td>
                <td>{row.flag}</td>
                <td>{row.selected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
