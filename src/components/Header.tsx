import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { TYPE_IN_DEPTH_PATH } from '../lib/unlock'
import { Face, MenuDots } from './Icons'

const links = [
  { to: '/', label: 'Home' },
  { to: '/quiz', label: 'Take the quiz' },
  { to: TYPE_IN_DEPTH_PATH, label: 'Your Type in Depth' },
  { to: '/compatibility', label: 'Compatibility' },
  { to: '/types', label: 'Sprouts' },
  { to: '/guides', label: 'Guides' },
  { to: '/about', label: 'About' },
  ...(import.meta.env.DEV ? [{ to: '/admin', label: 'Edit' }] : []),
]

export function Header() {
  const [open, setOpen] = useState(false)

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
          Jung Functions
          <small>free quiz ↑</small>
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
      </nav>
    </header>
  )
}
