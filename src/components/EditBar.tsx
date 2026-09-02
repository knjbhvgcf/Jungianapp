import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PERSONALITY_TYPES, typePath } from '../data/personalityTypes'
import { useEditMode } from '../lib/editMode'
import { TYPE_IN_DEPTH_PATH } from '../lib/unlock'
import { Button } from './Button'

function showTypePicker(pathname: string) {
  return (
    pathname.startsWith('/types') ||
    pathname === '/results' ||
    pathname === TYPE_IN_DEPTH_PATH ||
    pathname === '/compatibility'
  )
}

export function EditBar() {
  const edit = useEditMode()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (!edit.editing) return null

  async function onSave() {
    await edit.save()
  }

  function onExit() {
    if (edit.exit()) {
      if (pathname === '/admin') navigate('/')
    }
  }

  function onPickType(code: string) {
    edit.setPreviewType(code)
    if (pathname.startsWith('/types/') || pathname === '/types') {
      navigate(typePath(code))
    }
  }

  return (
    <div className="edit-bar" role="region" aria-label="Edit mode">
      <p className="edit-bar__status">
        {edit.dirty ? 'Unsaved changes' : 'Editing the live pages'}
      </p>
      {showTypePicker(pathname) ? (
        <label className="edit-bar__type">
          <span>Type</span>
          <select value={edit.previewType} onChange={(event) => onPickType(event.target.value)}>
            {PERSONALITY_TYPES.map((type) => (
              <option key={type.code} value={type.code}>
                {type.code} {type.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="edit-bar__actions">
        <button type="button" className="edit-bar__btn" disabled={edit.busy} onClick={() => void onSave()}>
          {edit.busy ? 'Saving…' : 'Save'}
        </button>
        <Link to="/admin" className="edit-bar__btn edit-bar__btn--ghost">
          Quiz items
        </Link>
        <button type="button" className="edit-bar__btn edit-bar__btn--ghost" onClick={onExit}>
          Exit
        </button>
      </div>
      {edit.message ? <p className="edit-bar__message">{edit.message}</p> : null}
    </div>
  )
}

export function EditGate({
  onUnlocked,
}: {
  onUnlocked?: () => void
}) {
  const edit = useEditMode()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await edit.tryUnlock(password)
      onUnlocked?.()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not unlock')
    }
  }

  return (
    <form className="cms-login" onSubmit={(event) => void submit(event)}>
      <label className="cms-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      {edit.status?.usingDefault ? (
        <p className="cms-note">
          No <code>ADMIN_PASSWORD</code> is set, so the password is <code>jung</code> until you
          change it.
        </p>
      ) : null}
      {error ? <p className="cms-status">{error}</p> : null}
      <Button type="submit">Start editing</Button>
    </form>
  )
}
