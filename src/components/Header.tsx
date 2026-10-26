import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { QUIZ_PATH } from '../lib/quizPath'
import { COMPATIBILITY_OFFERED } from '../lib/unlock'
import {
  WORKSPACE_JOIN_PATH,
  WORKSPACE_NAME,
  WORKSPACE_OFFERED,
  WORKSPACE_PATH,
  workspaceUnlocked,
} from '../lib/workspace/offered'
import { useHouse } from '../lib/workspace/store'
import { Face, MenuDots } from './Icons'

const links = [
  { to: '/', label: 'Home' },
  { to: QUIZ_PATH, label: 'Take the quiz' },
  { to: '/types', label: 'Sprouts' },
  { to: '/guides', label: 'Guides' },
  { to: '/about', label: 'About' },
  ...(COMPATIBILITY_OFFERED ? [{ to: '/compatibility', label: 'Compatibility' }] : []),
]

export function Header() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const house = useHouse()
  const inApp = WORKSPACE_OFFERED && location.pathname.startsWith(WORKSPACE_PATH)
  const signedIn = inApp && Boolean(house)
  const inHouse = signedIn && workspaceUnlocked(house)

  if (inApp) {
    return (
      <header className="site-header">
        <div className="wrap site-header__inner site-header__inner--app">
          <Link to={QUIZ_PATH} className="site-header__text">
            quiz
          </Link>
          <Link to={signedIn ? WORKSPACE_PATH : WORKSPACE_JOIN_PATH} className="brand">
            Jungology
            <small>App</small>
          </Link>
          {inHouse ? (
            <button
              type="button"
              className="site-header__text site-header__text--end"
              onClick={() => window.dispatchEvent(new Event('jungology:account'))}
            >
              account
            </button>
          ) : (
            <span />
          )}
        </div>
      </header>
    )
  }

  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <button
          type="button"
          className="icon-btn icon-btn--square"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <MenuDots />
        </button>

        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          Jungology
          <small>Jung Functions Quiz ↑</small>
        </Link>

        <Link to="/types" className="icon-btn icon-btn--circle" aria-label="Sixteen sprouts">
          <Face />
        </Link>
      </div>

      <nav
        id="site-nav"
        className={open ? 'site-nav is-open' : 'site-nav'}
        aria-label="Primary"
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            onClick={() => setOpen(false)}
            end={link.to === '/'}
          >
            {link.label}
          </NavLink>
        ))}
        {WORKSPACE_OFFERED ? (
          <NavLink
            to={house ? WORKSPACE_PATH : WORKSPACE_JOIN_PATH}
            className={() =>
              location.pathname.startsWith(WORKSPACE_PATH) ? 'is-active' : undefined
            }
            onClick={() => setOpen(false)}
          >
            {WORKSPACE_NAME}
          </NavLink>
        ) : null}
        {import.meta.env.DEV ? (
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            onClick={() => setOpen(false)}
          >
            Edit
          </NavLink>
        ) : null}
      </nav>
    </header>
  )
}
