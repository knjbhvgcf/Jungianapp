import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sparkle } from './Icons'

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  className?: string
  to?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  to,
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const classes = `btn btn--${variant} ${className}`.trim()
  const content =
    variant === 'primary' ? (
      <>
        <Sparkle className="btn-sparkle" />
        <span>{children}</span>
        <Sparkle className="btn-sparkle" />
      </>
    ) : (
      children
    )

  if (to) {
    const external = /^https?:\/\//.test(to)
    if (external) {
      const checkout = /buy\.stripe\.com|checkout\.stripe\.com/.test(to)
      return (
        <a
          href={to}
          className={classes}
          {...(checkout ? {} : { target: '_blank', rel: 'noreferrer' })}
        >
          {content}
        </a>
      )
    }
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  )
}
