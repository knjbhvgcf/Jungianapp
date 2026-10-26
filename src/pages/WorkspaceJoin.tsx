import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import { requestWorkspaceLink } from '../lib/workspace/accountClient'
import { startWorkspaceCheckout } from '../lib/workspace/checkout'
import {
  WORKSPACE_KEEP_PATH,
  WORKSPACE_NAME,
  WORKSPACE_PATH,
  WORKSPACE_PRICE_LINE,
  workspaceUnlocked,
} from '../lib/workspace/offered'
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
  const [busy, setBusy] = useState<'trial' | 'link' | null>(null)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState('')
  const params = new URLSearchParams(location.search)
  const expired = params.get('link') === 'expired'
  const host = typeof window === 'undefined' ? '' : window.location.hostname
  const localPreview = host === '127.0.0.1' || host === 'localhost'
  const stripeReturn =
    params.get('session_id')?.startsWith('cs_') || params.get('checkout') === 'success'

  useEffect(() => {
    void hydrateHouse()
  }, [])

  if (stripeReturn) {
    return <Navigate to={`${WORKSPACE_PATH}${location.search}`} replace />
  }

  if (status === 'in' && house) {
    if (!workspaceUnlocked(house)) return <Navigate to={WORKSPACE_PATH} replace />
    const snapshot = loadResultSnapshot()
    if (!house.self && snapshot && !keepSnapshotWasSkipped(snapshot)) {
      return <Navigate to={WORKSPACE_KEEP_PATH} replace />
    }
    return <Navigate to={WORKSPACE_PATH} replace />
  }

  async function startTrial() {
    setBusy('trial')
    setError('')
    try {
      window.location.href = await startWorkspaceCheckout('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open Stripe.')
      setBusy(null)
    }
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!looksLikeEmail(trimmed)) {
      setError('Need an email this account can belong to.')
      return
    }
    setBusy('link')
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
      setBusy(null)
    }
  }

  return (
    <>
      <Seo
        title={`${WORKSPACE_NAME} | Jungology`}
        description="Start the 7-day trial. The account is created from the email you use on Stripe."
        path="/workspace/join"
        robots="noindex,nofollow"
      />
      <section className="section workspace">
        <div className="wrap screen">
          <p className="eyebrow">
            {WORKSPACE_PRICE_LINE}. Cancel anytime.
          </p>
          <h1 className="serif-title">{WORKSPACE_NAME}</h1>
          <p className="lede">
            Start the 7-day trial on Stripe first. The account is created from the email you enter
            there, so the rooms open on that address.
          </p>
          {expired ? <p className="note">That sign-in link is used or has expired.</p> : null}
          {status === 'unknown' ? <p className="note">Opening the account…</p> : null}
          {error ? <p className="note">{error}</p> : null}
          <div className="workspace-account-actions">
            <Button type="button" disabled={Boolean(busy)} onClick={() => void startTrial()}>
              {busy === 'trial' ? 'Opening Stripe' : 'Start 7 days free'}
            </Button>
          </div>
          <form className="workspace-add" onSubmit={(event) => void onEmail(event)}>
            <p className="note">Already have an account? Sign in with that email.</p>
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
            <Button type="submit" variant="ghost" disabled={Boolean(busy)}>
              {busy === 'link' ? 'Making the link' : 'Email me a sign-in link'}
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
