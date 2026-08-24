import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Sparkle } from '../components/Icons'
import { Seo } from '../components/Seo'
import { TypePortrait } from '../components/TypePortrait'
import { archetypePage } from '../data/archetypePages'
import { FUNCTIONS } from '../data/functions'
import { PERSONALITY_TYPES, typeByCode, typePath } from '../data/personalityTypes'
import { NotFound } from './NotFound'

const STACK_LABELS = ['Hero', 'Parent', 'Child', 'Inferior'] as const

export function TypesIndex() {
  return (
    <>
      <Seo
        title="Sixteen sprouts | Jung Functions"
        description="Meet the sixteen sprouts this quiz names — each a Jungian type pattern with a portrait, stack, and a short reading."
        path="/types"
      />
      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">sprouts</p>
          <h1 className="serif-title">Sixteen sprouts</h1>
          <p className="lede">
            Each sprout is a leading function and the function that supports it, a little character
            you can meet before you take the quiz, or after, if you want a page you can keep. The
            kit is a key: hood if the dominant turns inward, lantern for intuition, quill and book
            for thinking, sword or flower for feeling, and the work of the hands for sensation.
          </p>
          <ul className="type-key">
            <li>
              <strong>Hood / cape</strong>
              introverted dominant
            </li>
            <li>
              <strong>Hair shown</strong>
              extraverted dominant
            </li>
            <li>
              <strong>Lantern</strong>
              intuition
            </li>
            <li>
              <strong>Tools, keys, basket</strong>
              sensation
            </li>
            <li>
              <strong>Quill &amp; book</strong>
              thinking
            </li>
            <li>
              <strong>Sword or flower</strong>
              feeling
            </li>
          </ul>
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
          <div className="sketch-stage">
            <Sparkle className="sparkle sparkle--1" />
            <Sparkle className="sparkle sparkle--2" />
            <Sparkle className="sparkle sparkle--3" />
            <Sparkle className="sparkle sparkle--4" />
            <div className="type-bob">
              <TypePortrait
                hero={hero}
                image={selected.image}
                alt={`${selected.code} ${selected.title}`}
              />
            </div>
          </div>
          <p className="eyebrow">sprout</p>
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
              All sprouts
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
            the quiz, on the paid map. This page is the public face of the sprout.
          </p>
          <p>
            <Button to="/dossier">Open the map</Button>
          </p>
        </div>

        {previous && next ? (
          <nav className="wrap type-pager" aria-label="Nearby sprouts">
            <Link to={typePath(previous.code)}>
              ← {previous.code} {previous.title}
            </Link>
            <Link to={typePath(next.code)}>
              {next.code} {next.title} →
            </Link>
          </nav>
        ) : null}

        <div className="wrap prose">
          <h2>The other sprouts</h2>
          <TypeGrid types={others} />
        </div>
      </article>
    </>
  )
}

function TypeGrid({ types = PERSONALITY_TYPES }: { types?: typeof PERSONALITY_TYPES }) {
  return (
    <ul className="type-index">
      {types.map((type, index) => (
        <li key={type.code}>
          <Link to={typePath(type.code)}>
            <span className="type-index__stage">
              <Sparkle className="sparkle sparkle--1" />
              <Sparkle className="sparkle sparkle--2" />
              <Sparkle className="sparkle sparkle--3" />
              <span className="type-bob" style={{ animationDelay: `${(index % 8) * 0.14}s` }}>
                <TypePortrait
                  hero={type.stack[0]}
                  image={type.image}
                  className="sketch--mini"
                  alt=""
                />
              </span>
            </span>
            <strong>{type.code}</strong>
            <span>{type.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
