import { Link } from 'react-router-dom'
import { TEST_LANDING_PATH } from '../lib/quizPath'
import { WORKSPACE_JOIN_PATH, WORKSPACE_OFFERED, WORKSPACE_PATH } from '../lib/workspace/offered'
import { useHouse } from '../lib/workspace/store'
import { Key, Potion, Sword } from './Icons'

export function Footer() {
  const house = useHouse()
  return (
    <footer className="site-footer">
      <nav className="dock" aria-label="Footer">
        <Link to={TEST_LANDING_PATH} className="icon-btn icon-btn--circle" aria-label="Jungian cognitive functions test">
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
        An educational{' '}
        <Link to={TEST_LANDING_PATH}>Jungian cognitive functions test</Link>
        {' '}based on Jung’s psychological functions, not a medical or diagnostic
        tool, and not the MBTI® instrument.{' '}
        <Link to="/types">Sprouts</Link>
        {' · '}
        <Link to="/guides">Guides</Link>
        {' · '}
        <Link to="/type-theory">Type theory</Link>
        {' · '}
        <Link to="/jung-vs-mbti">Jung and MBTI®</Link>
        {' · '}
        <Link to="/legal">Buying</Link>
        {WORKSPACE_OFFERED ? (
          <>
            {' · '}
            <Link to={house ? WORKSPACE_PATH : WORKSPACE_JOIN_PATH}>Jungology App</Link>
          </>
        ) : null}
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
