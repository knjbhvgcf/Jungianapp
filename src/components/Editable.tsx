import type { ReactNode } from 'react'
import { useEditMode } from '../lib/editMode'
import { Button } from './Button'

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'li' | 'cite' | 'blockquote' | 'strong' | 'small'

type EditableProps = {
  value: string
  onChange: (value: string) => void
  as?: Tag
  className?: string
  multiline?: boolean
  label?: string
}

export function Editable({
  value,
  onChange,
  as = 'p',
  className,
  multiline,
  label,
}: EditableProps) {
  const { editing } = useEditMode()
  const Tag = as
  const isMulti = multiline ?? (as === 'p' || as === 'blockquote' || as === 'li')

  if (!editing) {
    return <Tag className={className}>{value}</Tag>
  }

  return (
    <Tag className={['is-editable', className].filter(Boolean).join(' ')} data-edit={label}>
      {isMulti ? (
        <textarea
          className="editable__field"
          value={value}
          rows={Math.max(2, Math.ceil(value.length / 72))}
          aria-label={label ?? 'Edit text'}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="editable__field"
          value={value}
          aria-label={label ?? 'Edit text'}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Tag>
  )
}

type EditableButtonProps = {
  value: string
  onChange: (value: string) => void
  variant?: 'primary' | 'ghost'
  to?: string
  onClick?: () => void
  label?: string
}

export function EditableButton({
  value,
  onChange,
  variant = 'primary',
  to,
  onClick,
  label = 'Button',
}: EditableButtonProps) {
  const { editing } = useEditMode()
  if (!editing) {
    if (to) return <Button to={to} variant={variant}>{value}</Button>
    return (
      <Button variant={variant} onClick={onClick}>
        {value}
      </Button>
    )
  }
  return (
    <span className={`btn btn--${variant} is-editable-btn`} data-edit={label}>
      <input
        className="editable__field"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  )
}

export function EditSeo({
  title,
  description,
  onTitle,
  onDescription,
}: {
  title: string
  description: string
  onTitle: (value: string) => void
  onDescription: (value: string) => void
}) {
  const { editing } = useEditMode()
  if (!editing) return null
  return (
    <details className="edit-seo">
      <summary>Search title and description</summary>
      <Editable as="p" label="Search title" value={title} onChange={onTitle} multiline={false} />
      <Editable as="p" label="Search description" value={description} onChange={onDescription} multiline />
    </details>
  )
}

export function EditHint({ children }: { children: ReactNode }) {
  const { editing } = useEditMode()
  if (!editing) return null
  return <p className="edit-hint">{children}</p>
}
