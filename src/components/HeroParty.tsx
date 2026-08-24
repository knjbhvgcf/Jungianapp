import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TypePortrait } from './TypePortrait'
import { PERSONALITY_TYPES, type PersonalityType, typePath } from '../data/personalityTypes'

function pickTwo(): [PersonalityType, PersonalityType] {
  const pool = [...PERSONALITY_TYPES]
  const first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
  const second = pool[Math.floor(Math.random() * pool.length)]
  if (!first || !second) return [PERSONALITY_TYPES[0]!, PERSONALITY_TYPES[1]!]
  return [first, second]
}

export function HeroParty() {
  const [pair] = useState(pickTwo)

  return (
    <div className="hero-party" aria-label="Two of the sixteen sprouts">
      {pair.map((type, index) => (
        <Link
          key={type.code}
          to={typePath(type.code)}
          className="hero-party__fig"
          style={{ animationDelay: `${index * 0.2}s` }}
          title={`${type.code} — ${type.title}`}
        >
          <TypePortrait
            hero={type.stack[0]}
            image={type.image}
            alt={`${type.code} ${type.title}`}
          />
        </Link>
      ))}
    </div>
  )
}
