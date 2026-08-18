import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import { TypePortrait } from '../components/TypePortrait'
import { archetypePage } from '../data/archetypePages'
import { FUNCTIONS } from '../data/functions'
import { PERSONALITY_TYPES, typeByCode, typePath } from '../data/personalityTypes'
import { portraitSrc } from '../lib/portrait'
import { NotFound } from './NotFound'

const STACK_LABELS = ['Hero', 'Parent', 'Child', 'Inferior'] as const

export function TypesIndex() {
  return (
    <>
      <Seo
        title="Sixteen types | Jung Functions"
        description="Browse the sixteen Jungian type patterns this quiz names, each with a portrait, stack, and a short reading."
        path="/types"
      />
      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">types</p>
          <h1 className="serif-title">Sixteen types</h1>
          <p className="lede">
            Each pattern is a leading function and the function that supports it, named here as a
            character you can meet before you take the quiz, or after, if you want a page you can
            keep.
          </p>
          <TypeGrid />
          <p>
            <Button to="/quiz">Begin the quiz</Button>
          </p>
        </div>
      </article>
    </>
  )
}

export function TypePage() {
  const { code = '' } = useParams()
  const selected = typeByCode(code)
  if (!selected) return <NotFound />

  const page = archetypePage(selected.code)
  const hero = selected.stack[0]
  const others = PERSONALITY_TYPES.filter((type) => type.code !== selected.code)
  const index = PERSONALITY_TYPES.findIndex((type) => type.code === selected.code)
  const previous = PERSONALITY_TYPES[(index - 1 + PERSONALITY_TYPES.length) % PERSONALITY_TYPES.length]
  const next = PERSONALITY_TYPES[(index + 1) % PERSONALITY_TYPES.length]

  return (
    <>
      <Seo
        title={`${selected.code} ${selected.title} | Jung Functions`}
        description={selected.summary}
        path={typePath(selected.code)}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${selected.code} — ${selected.title}`,
          description: selected.summary,
          author: { '@type': 'Organization', name: 'Jung Functions' },
        }}
      />
      <article className="section type-page">
        <header className="wrap screen dossier-hero">
          <div className="portrait-pair">
            <figure>
              <TypePortrait
                hero={hero}
                image={portraitSrc(selected.code, 'female', selected.image)}
                alt={`${selected.code} ${selected.title}, female portrait`}
              />
              <figcaption>Female</figcaption>
            </figure>
            <figure>
              <TypePortrait
                hero={hero}
                image={portraitSrc(selected.code, 'male', selected.image)}
                alt={`${selected.code} ${selected.title}, male portrait`}
              />
              <figcaption>Male</figcaption>
            </figure>
          </div>
          <p className="eyebrow">type</p>
          <h1 className="serif-title">
            {selected.code} — {selected.title}
          </h1>
          <p className="mono-stat">
            {selected.code.toLowerCase()} · {selected.name.toLowerCase()} · {hero} → {selected.stack[1]}
          </p>
          <p className="lede">{selected.summary}</p>
          {page ? <p>{page.tagline}</p> : null}
          <div className="hero__actions">
            <Button to="/quiz">Begin the quiz</Button>
            <Button to="/types" variant="ghost">
              All types
            </Button>
          </div>
        </header>

        <div className="wrap prose">
          <h2>Cognitive stack</h2>
          <ul className="archetype-stack">
            {selected.stack.map((id, position) => (
              <li key={id}>
                <span className="archetype-stack__label">{STACK_LABELS[position]}</span>
                <span className="archetype-stack__fn">
                  {id} — {FUNCTIONS[id].name}
                </span>
              </li>
            ))}
          </ul>
          <p>
            The longer map — Beebe’s eight, the day, work, relating, and the shadow — opens after
            the quiz, on the paid map. This page is the public face of the type.
          </p>
          <p>
            <Button to="/dossier">Open the map</Button>
          </p>
        </div>

        {previous && next ? (
          <nav className="wrap type-pager" aria-label="Nearby types">
            <Link to={typePath(previous.code)}>
              ← {previous.code} {previous.title}
            </Link>
            <Link to={typePath(next.code)}>
              {next.code} {next.title} →
            </Link>
          </nav>
        ) : null}

        <div className="wrap prose">
          <h2>The others</h2>
          <TypeGrid types={others} />
        </div>
      </article>
    </>
  )
}

function TypeGrid({ types = PERSONALITY_TYPES }: { types?: typeof PERSONALITY_TYPES }) {
  return (
    <ul className="type-index">
      {types.map((type) => (
        <li key={type.code}>
          <Link to={typePath(type.code)}>
            <TypePortrait
              hero={type.stack[0]}
              image={portraitSrc(type.code, 'female', type.image)}
              className="sketch--mini"
              alt=""
            />
            <strong>{type.code}</strong>
            <span>{type.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
