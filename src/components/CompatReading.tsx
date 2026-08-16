import { COMPAT_INTRO, groupedCompatibility } from '../data/compatibility'
import type { PersonalityType } from '../data/personalityTypes'

export function CompatReading({ type }: { type: PersonalityType }) {
  const groups = groupedCompatibility(type)

  return (
    <>
      <p>{COMPAT_INTRO}</p>
      {groups.map(([kind, rows]) => (
        <div key={kind} className="compat-group">
          <h3>{rows[0]?.label}</h3>
          {rows.map((row) => (
            <article key={row.other.code} className="compat-card">
              <p className="mono-stat">
                {row.other.code.toLowerCase()} · {row.charge}
              </p>
              <h4>
                {row.other.title}
                <span className="dossier-chapter__fn">
                  {' '}
                  · {row.other.stack[0]} → {row.other.stack[1]}
                </span>
              </h4>
              <p>{row.note}</p>
              <p>{row.detail}</p>
            </article>
          ))}
        </div>
      ))}
    </>
  )
}
