import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import { requestWorkspaceLink } from '../lib/workspace/accountClient'
import { WORKSPACE_KEEP_PATH, WORKSPACE_NAME, WORKSPACE_PATH, WORKSPACE_PRICE_LINE } from '../lib/workspace/offered'
import { loadResultSnapshot } from '../lib/workspace/snapshot'
import { hydrateHouse, keepSnapshotWasSkipped, useAccountStatus, useHouse } from '../lib/workspace/store'

function looksLikeEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value)
}

export function WorkspaceJoin() {
  const location = useLocation()
  const house = useHouse()
  const status = useAccountStatus()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState('')
  const expired = new URLSearchParams(location.search).get('link') === 'expired'
  const host = typeof window === 'undefined' ? '' : window.location.hostname
  const localPreview = host === '127.0.0.1' || host === 'localhost'

  useEffect(() => {
    void hydrateHouse()
  }, [])

  if (status === 'in' && house) {
    const snapshot = loadResultSnapshot()
    if (!house.self && snapshot && !keepSnapshotWasSkipped(snapshot)) {
      return <Navigate to={WORKSPACE_KEEP_PATH} replace />
    }
    return <Navigate to={WORKSPACE_PATH} replace />
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!looksLikeEmail(trimmed)) {
      setError('Need an email this account can belong to.')
      return
    }
    setBusy(true)
    setError('')
    setSent(false)
    setDevLink('')
    try {
      const result = await requestWorkspaceLink(trimmed)
      setDevLink(result.devLink ?? '')
      setSent(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not make the sign-in link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Seo
        title={`${WORKSPACE_NAME} | Jungology`}
        description="People in your life, and whether this hour is ordinary, a loop, or grip."
        path="/workspace/join"
        robots="noindex,nofollow"
      />
      <section className="section workspace">
        <div className="wrap screen">
          <p className="eyebrow">{WORKSPACE_PRICE_LINE}</p>
          <h1 className="serif-title">{WORKSPACE_NAME}</h1>
          <p className="lede">
            People in your life, and whether this hour is ordinary, a loop, or grip.
          </p>
          {expired ? <p className="note">That sign-in link is used or has expired.</p> : null}
          {status === 'unknown' ? <p className="note">Opening the account…</p> : null}
          <form className="workspace-add" onSubmit={(event) => void onEmail(event)}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
                placeholder="you@gmail.com"
                autoComplete="email"
              />
            </label>
            {error ? <p className="note">{error}</p> : null}
            <Button type="submit" disabled={busy}>
              {busy ? 'Making the link' : 'Continue with email'}
            </Button>
          </form>
          {sent && !devLink ? (
            <p className="note">Check that inbox. The link lasts 15 minutes.</p>
          ) : null}
          {localPreview && devLink ? (
            <>
              <p className="note">This preview does not send mail. Open the link to sign in.</p>
              <Button to={devLink}>Open the sign-in link</Button>
            </>
          ) : null}
        </div>
      </section>
    </>
  )
}
