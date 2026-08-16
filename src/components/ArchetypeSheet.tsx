import { archetypePage } from '../data/archetypePages'
import { BEEBE_ROLES, OPPOSITE_FUNCTION } from '../data/beebe'
import { FUNCTION_PORTRAITS } from '../data/functionPortraits'
import { FUNCTIONS } from '../data/functions'
import type { PersonalityType } from '../data/personalityTypes'

const STACK_LABELS = ['Dominant', 'Auxiliary', 'Tertiary', 'Inferior'] as const

export function ArchetypeSheet({ type }: { type: PersonalityType }) {
  const page = archetypePage(type.code)
  if (!page) return null

  const [hero, parent, child, anima] = type.stack
  const heroPortrait = FUNCTION_PORTRAITS[hero]
  const parentPortrait = FUNCTION_PORTRAITS[parent]

  return (
    <div className="archetype-sheet">
      <section>
        <h2>Mythic Archetype</h2>
        <p className="archetype-sheet__mythic">{page.mythic}</p>
        <p>{page.tagline}</p>
      </section>

      <section>
        <h2>Cognitive Functions</h2>
        <ul className="archetype-stack">
          {type.stack.map((id, index) => (
            <li key={id}>
              <span className="archetype-stack__label">{STACK_LABELS[index]}</span>
              <span className="archetype-stack__fn">
                {id} — {FUNCTIONS[id].name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="archetype-callout">
        The dominant function is {hero} — {page.dominantName}.
      </p>
      <p>
        <strong>{hero} is concerned with:</strong>
      </p>
      <ul>
        {heroPortrait.concerns.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <blockquote className="archetype-quote">
        A {hero}-dominant person often asks:{' '}
        {heroPortrait.asks.map((ask) => `“${ask}”`).join(' ')}
      </blockquote>

      <p className="archetype-callout">
        The auxiliary function is {parent} — {page.auxiliaryName}.
      </p>
      <p>
        <strong>{parent} is concerned with:</strong>
      </p>
      <ul>
        {parentPortrait.concerns.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{page.bridge}</p>
      <p>The pattern becomes:</p>
      <blockquote className="archetype-quote">“{page.pattern}”</blockquote>
      <p>{page.image}</p>

      <RoleTable title="Main functions" rows={page.roles.slice(0, 4)} offset={0} ids={[hero, parent, child, anima]} />
      <RoleTable
        title="The shadow functions"
        rows={page.roles.slice(4)}
        offset={4}
        ids={[
          OPPOSITE_FUNCTION[hero],
          OPPOSITE_FUNCTION[parent],
          OPPOSITE_FUNCTION[child],
          OPPOSITE_FUNCTION[anima],
        ]}
      />
    </div>
  )
}

function RoleTable({
  title,
  rows,
  offset,
  ids,
}: {
  title: string
  rows: { name: string; description: string }[]
  offset: number
  ids: (keyof typeof FUNCTIONS)[]
}) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="role-table-wrap">
        <table className="role-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Archetype</th>
              <th>Function</th>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const role = BEEBE_ROLES[offset + index]
              const id = ids[index]
              if (!role || !id) return null
              return (
                <tr key={role.key}>
                  <td data-label="Position">{offset + index + 1}</td>
                  <td data-label="Archetype">{role.full}</td>
                  <td data-label="Function">
                    {id} — {FUNCTIONS[id].name}
                  </td>
                  <td data-label="Name">{row.name}</td>
                  <td data-label="Description">{row.description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
