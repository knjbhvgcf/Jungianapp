import { BEEBE_ROLES, OPPOSITE_FUNCTION } from '../data/beebe'
import { FUNCTION_PORTRAITS } from '../data/functionPortraits'
import { FUNCTIONS } from '../data/functions'
import type { PersonalityType } from '../data/personalityTypes'
import { archetypeFrom, useEditMode, useTypeDraft } from '../lib/editMode'
import { archetypePage } from '../data/archetypePages'
import { Editable } from './Editable'

const STACK_LABELS = [
  'Hero / Heroine',
  'Parent',
  'Eternal Child',
  'Inferior (Anima / Animus)',
] as const

export function ArchetypeSheet({ type }: { type: PersonalityType }) {
  const draft = useTypeDraft(type.code)
  const { patchType } = useEditMode()
  const page = draft ? archetypeFrom(draft) : archetypePage(type.code)
  if (!page) return null

  const [hero, parent, child, anima] = type.stack
  const heroPortrait = FUNCTION_PORTRAITS[hero]
  const parentPortrait = FUNCTION_PORTRAITS[parent]

  function patch(partial: Partial<typeof page> & { patternNote?: string }) {
    patchType(type.code, (current) => ({
      ...current,
      ...partial,
      patternNote: partial.patternNote ?? current.patternNote,
    }))
  }

  return (
    <div className="archetype-sheet">
      <section>
        <h2>Mythic Archetype</h2>
        <Editable
          as="p"
          className="archetype-sheet__mythic"
          label="Mythic name"
          value={page.mythic}
          onChange={(mythic) => patch({ mythic })}
        />
        <Editable
          as="p"
          label="Tagline"
          value={page.tagline}
          onChange={(tagline) => patch({ tagline })}
        />
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
        The Hero / Heroine is {hero} —{' '}
        <Editable
          as="span"
          label="Dominant name"
          multiline={false}
          value={page.dominantName}
          onChange={(dominantName) => patch({ dominantName })}
        />
        .
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
        A {hero} Hero / Heroine often asks:{' '}
        {heroPortrait.asks.map((ask) => `“${ask}”`).join(' ')}
      </blockquote>

      <p className="archetype-callout">
        The Parent is {parent} —{' '}
        <Editable
          as="span"
          label="Auxiliary name"
          multiline={false}
          value={page.auxiliaryName}
          onChange={(auxiliaryName) => patch({ auxiliaryName })}
        />
        .
      </p>
      <p>
        <strong>{parent} is concerned with:</strong>
      </p>
      <ul>
        {parentPortrait.concerns.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Editable as="p" label="Bridge" value={page.bridge} onChange={(bridge) => patch({ bridge })} />
      <p>The pattern becomes:</p>
      <blockquote className="archetype-quote">
        “
        <Editable
          as="span"
          label="Pattern"
          value={page.pattern}
          onChange={(pattern) => patch({ pattern })}
        />
        ”
      </blockquote>
      <Editable
        as="p"
        label="Pattern note"
        value={page.image}
        onChange={(patternNote) => patch({ patternNote })}
      />

      <RoleTable
        title="The Ego Functions (Conscious)"
        rows={page.roles.slice(0, 4)}
        offset={0}
        ids={[hero, parent, child, anima]}
        code={type.code}
      />
      <RoleTable
        title="The Shadow Functions (Unconscious)"
        rows={page.roles.slice(4)}
        offset={4}
        ids={[
          OPPOSITE_FUNCTION[hero],
          OPPOSITE_FUNCTION[parent],
          OPPOSITE_FUNCTION[child],
          OPPOSITE_FUNCTION[anima],
        ]}
        code={type.code}
      />
    </div>
  )
}

function RoleTable({
  title,
  rows,
  offset,
  ids,
  code,
}: {
  title: string
  rows: { name: string; description: string }[]
  offset: number
  ids: (keyof typeof FUNCTIONS)[]
  code: string
}) {
  const { patchType } = useEditMode()

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
              const roleIndex = offset + index
              return (
                <tr key={role.key}>
                  <td data-label="Position">{roleIndex + 1}</td>
                  <td data-label="Archetype">{role.full}</td>
                  <td data-label="Function">
                    {id} — {FUNCTIONS[id].name}
                  </td>
                  <td data-label="Name">
                    <Editable
                      as="span"
                      label={`${role.full} name`}
                      value={row.name}
                      onChange={(name) =>
                        patchType(code, (type) => ({
                          ...type,
                          roles: type.roles.map((entry, entryIndex) =>
                            entryIndex === roleIndex ? { ...entry, name } : entry,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td data-label="Description">
                    <Editable
                      as="span"
                      label={`${role.full} description`}
                      value={row.description}
                      onChange={(description) =>
                        patchType(code, (type) => ({
                          ...type,
                          roles: type.roles.map((entry, entryIndex) =>
                            entryIndex === roleIndex ? { ...entry, description } : entry,
                          ),
                        }))
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
