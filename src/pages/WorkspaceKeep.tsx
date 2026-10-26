import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ScoreBar } from '../components/ScoreBar'
import { Seo } from '../components/Seo'
import { FUNCTION_IDS } from '../data/functions'
import { WORKSPACE_JOIN_PATH, WORKSPACE_NAME, WORKSPACE_PATH } from '../lib/workspace/offered'
import { loadResultSnapshot } from '../lib/workspace/snapshot'
import {
  hydrateHouse,
  saveSelfSnapshot,
  skipKeepSnapshot,
  useAccountStatus,
  useHouse,
} from '../lib/workspace/store'

export function WorkspaceKeep() {
  const navigate = useNavigate()
  const house = useHouse()
  const status = useAccountStatus()
  const snapshot = loadResultSnapshot()

  useEffect(() => {
    void hydrateHouse()
  }, [])

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
  if (house.self) return <Navigate to={WORKSPACE_PATH} replace />
  if (!snapshot) return <Navigate to={WORKSPACE_PATH} replace />
  const kept = snapshot

  const scores = FUNCTION_IDS.map((id) => ({
    id,
    raw: 0,
    percent: kept.percents[id] ?? 0,
  })).sort((a, b) => b.percent - a.percent)

  function save() {
    saveSelfSnapshot(kept)
    navigate(WORKSPACE_PATH)
  }

  function skip() {
    skipKeepSnapshot(kept)
    navigate(WORKSPACE_PATH)
  }

  return (
    <>
      <Seo
        title="Save the snapshot | Jungology"
        description={`Keep type and percentages in ${WORKSPACE_NAME}.`}
        path="/workspace/keep"
        robots="noindex,nofollow"
      />
      <section className="section workspace">
        <div className="wrap screen">
          <h1 className="serif-title">Save the snapshot?</h1>
          <p className="mono-stat">
            {kept.code} · {kept.stack[0]} Hero · {kept.stack[1]} Parent
          </p>
          <p className="lede">
            Type and eight percentages can go to this account. Skip, and there is no self until you
            retake or type the letters in.
          </p>
          <div className="score-list">
            {scores.map((score) => (
              <ScoreBar key={score.id} score={score} />
            ))}
          </div>
          <div className="hero__actions">
            <Button onClick={save}>Save to this account</Button>
            <Button variant="ghost" onClick={skip}>
              Skip
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
