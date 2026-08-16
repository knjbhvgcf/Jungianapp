type IconProps = {
  className?: string
}

export function Sparkle({ className = '' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1.2 13.6 9.2 21.8 12 13.6 14.8 12 22.8 10.4 14.8 2.2 12 10.4 9.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function MenuDots({ className = '' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="8" r="1.7" fill="currentColor" />
      <circle cx="16" cy="8" r="1.7" fill="currentColor" />
      <circle cx="8" cy="16" r="1.7" fill="currentColor" />
      <circle cx="16" cy="16" r="1.7" fill="currentColor" />
    </svg>
  )
}

export function Face({ className = '' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9.2" cy="11" r="1.05" fill="currentColor" />
      <circle cx="14.8" cy="11" r="1.05" fill="currentColor" />
      <path
        d="M8.6 15c.9 1.4 2.1 2.1 3.4 2.1s2.5-.7 3.4-2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Sword({ className = '' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.8 3.2 19 9.4l-1.2 1.2-2.1-.4-6.7 6.7H6.2v-2.8l6.7-6.7-.4-2.1L12.8 3.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5.2 18.8 3.4 20.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Potion({ className = '' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.5 4.5h5v2.2c2.4 1.4 4 4.2 4 7.4 0 3.7-2.9 6.4-6.5 6.4S5.5 17.8 5.5 14.1c0-3.2 1.6-6 4-7.4V4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.2 4.5h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 14.2c.8 1.8 2.2 2.7 4 2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function Key({ className = '' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8.2" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11.4 12h8.2v2.4h-1.8v2.2h-2.2V14.4H14.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
