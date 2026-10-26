import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../Button'
import {
  startWorkspaceCheckout,
  startWorkspacePortal,
  takeCheckoutNote,
  workspacePortalUrl,
} from '../../lib/workspace/checkout'
import {
  WORKSPACE_JOIN_PATH,
  WORKSPACE_NAME,
  WORKSPACE_PRICE,
  WORKSPACE_PRICE_LINE,
  workspaceUnlocked,
} from '../../lib/workspace/offered'
import { signOut, useHouse } from '../../lib/workspace/store'

function looksLikeEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value)
}

export function AccountRoom() {
  const navigate = useNavigate()
  const house = useHouse()
  const [payError, setPayError] = useState('')
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [checkoutNote, setCheckoutNote] = useState('')

  useEffect(() => {
    const note = takeCheckoutNote()
    if (note) setCheckoutNote(note)
  }, [])

  if (!house) return null
  const account = house

  const people = account.people.length
  const hours = account.hours.length
  const subscribed = workspaceUnlocked(account)
  const canManage = subscribed && (Boolean(account.stripeCustomerId) || Boolean(workspacePortalUrl()))

  async function subscribe() {
    if (!looksLikeEmail(account.email)) {
      setPayError('Need an email Stripe can send the receipt to.')
      return
    }
    setPayError('')
    setBusy(true)
    try {
      window.location.href = await startWorkspaceCheckout(account.email)
    } catch (caught) {
      setPayError(caught instanceof Error ? caught.message : 'Could not open checkout.')
      setBusy(false)
    }
  }

  async function manage() {
    setPayError('')
    setBusy(true)
    try {
      window.location.href = await startWorkspacePortal()
    } catch (caught) {
      setPayError(caught instanceof Error ? caught.message : 'Could not open billing.')
      setBusy(false)
    }
  }

  function exportHouse() {
    const blob = new Blob([JSON.stringify(account, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = 'jungology-app.json'
    link.click()
    URL.revokeObjectURL(href)
  }

  async function leave() {
    const ok = window.confirm(
      'This signs this device out. The library stays on the account.',
    )
    if (!ok) return
    setLeaving(true)
    await signOut()
    navigate(WORKSPACE_JOIN_PATH)
  }

  return (
    <>
      <p className="lede">{WORKSPACE_PRICE_LINE}. Cancel anytime.</p>
      {checkoutNote ? <p className="note">{checkoutNote}</p> : null}
      <div className="workspace-account-actions">
        {subscribed ? (
          canManage ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void manage()}>
              {busy ? 'Opening Stripe' : 'Manage on Stripe'}
            </Button>
          ) : null
        ) : (
          <Button type="button" disabled={busy} onClick={() => void subscribe()}>
            {busy ? 'Opening Stripe' : 'Start 7 days free'}
          </Button>
        )}
      </div>
      {payError ? <p className="note">{payError}</p> : null}
      <p className="workspace-chart__caption">This account holds</p>
      <ul className="workspace-account">
        <li>{account.email}</li>
        {subscribed ? <li>{WORKSPACE_PRICE} / month on Stripe</li> : null}
        <li>{account.self ? account.self.code : 'No type yet'}</li>
        <li>
          {people} {people === 1 ? 'person' : 'people'} in the library
        </li>
        <li>
          {hours} journal {hours === 1 ? 'hour' : 'hours'}
        </li>
      </ul>
      <div className="workspace-account-actions">
        <Button type="button" variant="ghost" onClick={exportHouse}>
          Download a copy
        </Button>
        <Button type="button" variant="ghost" disabled={leaving} onClick={() => void leave()}>
          Sign out
        </Button>
      </div>
    </>
  )
}

export function WorkspacePaywall({ note = '' }: { note?: string }) {
  const navigate = useNavigate()
  const house = useHouse()
  const [payError, setPayError] = useState('')
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [checkoutNote, setCheckoutNote] = useState(note)

  useEffect(() => {
    if (note) setCheckoutNote(note)
  }, [note])

  if (!house) return null
  const account = house

  async function subscribe() {
    if (!looksLikeEmail(account.email)) {
      setPayError('Need an email Stripe can send the receipt to.')
      return
    }
    setPayError('')
    setBusy(true)
    try {
      window.location.href = await startWorkspaceCheckout(account.email)
    } catch (caught) {
      setPayError(caught instanceof Error ? caught.message : 'Could not open checkout.')
      setBusy(false)
    }
  }

  async function leave() {
    setLeaving(true)
    await signOut()
    navigate(WORKSPACE_JOIN_PATH)
  }

  return (
    <div className="wrap screen">
      <p className="eyebrow">{WORKSPACE_PRICE_LINE}</p>
      <h1 className="serif-title">{WORKSPACE_NAME}</h1>
      <p className="lede">Start the 7-day trial to open the rooms. Cancel anytime on Stripe.</p>
      {checkoutNote ? <p className="note">{checkoutNote}</p> : null}
      <p className="note">{account.email}</p>
      {payError ? <p className="note">{payError}</p> : null}
      <div className="hero__actions">
        <Button type="button" disabled={busy} onClick={() => void subscribe()}>
          {busy ? 'Opening Stripe' : 'Start 7 days free'}
        </Button>
        <Button type="button" variant="ghost" disabled={leaving} onClick={() => void leave()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
