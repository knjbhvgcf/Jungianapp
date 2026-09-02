import { useState, type FormEvent } from 'react'
import { Editable, EditableButton } from './Editable'
import { Button } from './Button'
import { useEditMode, useSiteCopy } from '../lib/editMode'
import {
  productCheckoutUrl,
  productPrice,
  setProductUnlocked,
  tryUnlockKey,
  type UnlockProduct,
} from '../lib/unlock'

type UnlockPanelProps = {
  product: UnlockProduct
  onUnlocked: () => void
}

export function UnlockPanel({ product, onUnlocked }: UnlockPanelProps) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const checkout = productCheckoutUrl(product)
  const price = productPrice(product)
  const { editing, patchPages } = useEditMode()
  const copy = useSiteCopy().paywall[product]
  const inputId = product === 'map' ? 'map-key' : 'compat-key'

  function patch(partial: Partial<typeof copy>) {
    patchPages((pages) => ({
      ...pages,
      paywall: {
        ...pages.paywall,
        [product]: { ...pages.paywall[product], ...partial },
      },
    }))
  }

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
      <Editable
        as="p"
        className="eyebrow"
        label="Eyebrow"
        multiline={false}
        value={copy.eyebrow}
        onChange={(eyebrow) => patch({ eyebrow })}
      />
      <Editable as="h2" label="Title" value={copy.title} onChange={(title) => patch({ title })} />
      <Editable as="p" label="Body" value={copy.body} onChange={(body) => patch({ body })} />
      <ul className="unlock-panel__list">
        {copy.bullets.map((item, index) => (
          <Editable
            key={index}
            as="li"
            label={`Bullet ${index + 1}`}
            value={item}
            onChange={(next) =>
              patch({
                bullets: copy.bullets.map((entry, entryIndex) =>
                  entryIndex === index ? next : entry,
                ),
              })
            }
          />
        ))}
      </ul>
      <div className="unlock-panel__actions">
        {editing ? (
          checkout ? (
            <EditableButton
              to={checkout}
              label="Checkout"
              value={copy.cta}
              onChange={(cta) => patch({ cta })}
            />
          ) : (
            <Editable
              as="p"
              className="note"
              label="Missing checkout"
              value={copy.checkoutMissing}
              onChange={(checkoutMissing) => patch({ checkoutMissing })}
            />
          )
        ) : checkout ? (
          <Button to={checkout}>
            {copy.cta} · {price}
          </Button>
        ) : (
          <p className="note">{copy.checkoutMissing}</p>
        )}
      </div>
      <form className="unlock-form" onSubmit={submit}>
        {editing ? (
          <>
            <Editable
              as="p"
              label="Key label"
              multiline={false}
              value={copy.keyLabel}
              onChange={(keyLabel) => patch({ keyLabel })}
            />
            <Editable
              as="p"
              label="Key placeholder"
              multiline={false}
              value={copy.keyPlaceholder}
              onChange={(keyPlaceholder) => patch({ keyPlaceholder })}
            />
          </>
        ) : (
          <label htmlFor={inputId}>{copy.keyLabel}</label>
        )}
        <div className="unlock-form__row">
          <input
            id={inputId}
            name="key"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            autoComplete="off"
            placeholder={copy.keyPlaceholder}
          />
          {editing ? (
            <EditableButton
              variant="ghost"
              label="Unlock"
              value={copy.unlockButton}
              onChange={(unlockButton) => patch({ unlockButton })}
            />
          ) : (
            <Button type="submit" variant="ghost">
              {copy.unlockButton}
            </Button>
          )}
        </div>
        {editing ? (
          <Editable
            as="p"
            label="Wrong-key error"
            multiline={false}
            value={copy.error}
            onChange={(errorText) => patch({ error: errorText })}
          />
        ) : error ? (
          <p className="unlock-form__error">{error}</p>
        ) : null}
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
