import { Link } from 'react-router-dom'
import { Key, Potion, Sword } from './Icons'

export function Footer() {
  return (
    <footer className="site-footer">
      <nav className="dock" aria-label="Footer">
        <Link to="/quiz" className="icon-btn icon-btn--circle" aria-label="Take the quiz">
          <Sword />
        </Link>
        <Link to="/" className="icon-btn icon-btn--circle" aria-label="Home">
          <Key />
        </Link>
        <Link to="/about" className="icon-btn icon-btn--circle" aria-label="About">
          <Potion />
        </Link>
      </nav>
      <p>
        An educational quiz based on Jung’s psychological functions, not a medical or diagnostic
        tool, and not the MBTI® instrument.{' '}
        <Link to="/types">Sprouts</Link>
        {' · '}
        <Link to="/guides">Guides</Link>
        {' · '}
        <Link to="/jung-vs-mbti">Jung and MBTI®</Link>
        {import.meta.env.DEV ? (
          <>
            {' · '}
            <Link to="/admin">Edit</Link>
          </>
        ) : null}
      </p>
    </footer>
  )
}
