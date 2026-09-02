import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Editable } from '../components/Editable'
import { Sparkle } from '../components/Icons'
import { Seo } from '../components/Seo'
import { TypePortrait } from '../components/TypePortrait'
import { FUNCTIONS } from '../data/functions'
import { typeByCode, typePath } from '../data/personalityTypes'
import {
  archetypeFrom,
  asPersonality,
  useEditMode,
  usePersonalityTypes,
  useTypeDraft,
} from '../lib/editMode'
import { TYPE_IN_DEPTH_PATH } from '../lib/unlock'
import { NotFound } from './NotFound'

const STACK_LABELS = ['Hero', 'Parent', 'Child', 'Inferior'] as const

export function TypesIndex() {
  const types = usePersonalityTypes()
  return (
    <>
      <Seo
        title="Sixteen sprouts | Jung Functions Quiz"
        description="Each sprout represents a leading function and the function that supports it — a little character you can meet before you take the quiz, or return to afterwards."
        path="/types"
      />
      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">sprouts</p>
          <h1 className="serif-title">Sixteen sprouts</h1>
          <p className="lede">
            Each sprout represents a leading function and the function that supports it—a little
            character you can meet before you take the quiz, or return to afterwards. Each character
            is built around the particular way those functions orient the psyche.
          </p>
          <TypeGrid types={types} />
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
  const listed = typeByCode(code)
  if (!listed) return <NotFound />

  return <TypePageBody code={listed.code} />
}

function TypePageBody({ code }: { code: string }) {
  const draft = useTypeDraft(code)
  const { editing, patchType, setPreviewType } = useEditMode()
  const all = usePersonalityTypes()
  const selected = draft ? asPersonality(draft) : typeByCode(code)
  const page = draft ? archetypeFrom(draft) : null

  useEffect(() => {
    if (editing) setPreviewType(code)
  }, [code, editing, setPreviewType])

  if (!selected || !draft) return <NotFound />

  const hero = selected.stack[0]
  const others = all.filter((type) => type.code !== selected.code)
  const index = all.findIndex((type) => type.code === selected.code)
  const previous = all[(index - 1 + all.length) % all.length]
  const next = all[(index + 1) % all.length]

  return (
    <>
      <Seo
        title={`${selected.code} ${selected.title} | Jung Functions Quiz`}
        description={selected.summary}
        path={typePath(selected.code)}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${selected.code} — ${selected.title}`,
          description: selected.summary,
          author: { '@type': 'Organization', name: 'Jungology' },
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
            {selected.code} —{' '}
            <Editable
              as="span"
              label="Title"
              value={selected.title}
              onChange={(title) => patchType(code, (type) => ({ ...type, title }))}
            />
          </h1>
          <p className="mono-stat">
            {selected.code.toLowerCase()} ·{' '}
            <Editable
              as="span"
              label="Name"
              multiline={false}
              value={selected.name}
              onChange={(name) => patchType(code, (type) => ({ ...type, name }))}
            />{' '}
            · {hero} → {selected.stack[1]}
          </p>
          <Editable
            as="p"
            className="lede"
            label="Summary"
            value={selected.summary}
            onChange={(summary) => patchType(code, (type) => ({ ...type, summary }))}
          />
          {page ? (
            <Editable
              as="p"
              label="Tagline"
              value={page.tagline}
              onChange={(tagline) => patchType(code, (type) => ({ ...type, tagline }))}
            />
          ) : null}
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
            The longer reading — Beebe’s eight, the day, work, relating, and the shadow — opens
            after the quiz, in Your Type in Depth. This page is the public face of the sprout.
          </p>
          <p>
            <Button to={TYPE_IN_DEPTH_PATH}>Your Type in Depth</Button>
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

function TypeGrid({
  types,
}: {
  types: ReturnType<typeof usePersonalityTypes>
}) {
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
