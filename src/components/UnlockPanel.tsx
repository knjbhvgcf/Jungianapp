import { useState, type FormEvent } from 'react'
import { siteCopy } from '../lib/copy'
import {
  productCheckoutUrl,
  productPrice,
  setProductUnlocked,
  tryUnlockKey,
  type UnlockProduct,
} from '../lib/unlock'
import { Button } from './Button'

type UnlockPanelProps = {
  product: UnlockProduct
  onUnlocked: () => void
}

export function UnlockPanel({ product, onUnlocked }: UnlockPanelProps) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const checkout = productCheckoutUrl(product)
  const price = productPrice(product)
  const copy = siteCopy.paywall[product]
  const inputId = product === 'map' ? 'map-key' : 'compat-key'

  function submit(event: FormEvent) {
    event.preventDefault()
    if (tryUnlockKey(key, product)) {
      setError('')
      onUnlocked()
      return
    }
    setError(copy.error)
  }

  return (
    <aside className="unlock-panel">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <ul className="unlock-panel__list">
        {copy.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="unlock-panel__actions">
        {checkout ? (
          <Button to={checkout}>
            {copy.cta} · {price}
          </Button>
        ) : (
          <p className="note">{copy.checkoutMissing}</p>
        )}
      </div>
      <form className="unlock-form" onSubmit={submit}>
        <label htmlFor={inputId}>{copy.keyLabel}</label>
        <div className="unlock-form__row">
          <input
            id={inputId}
            name="key"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            autoComplete="off"
            placeholder={copy.keyPlaceholder}
          />
          <Button type="submit" variant="ghost">
            {copy.unlockButton}
          </Button>
        </div>
        {error ? <p className="unlock-form__error">{error}</p> : null}
      </form>
      {import.meta.env.DEV ? (
        <p className="note">
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setProductUnlocked(product, true)
              onUnlocked()
            }}
          >
            Preview unlock (dev only)
          </button>
        </p>
      ) : null}
    </aside>
  )
}
