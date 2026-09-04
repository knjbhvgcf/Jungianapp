import { FUNCTIONS } from '../data/functions'
import type { BeebePlacement } from '../lib/scoring'

type BeebeStackProps = {
  placements: BeebePlacement[]
  order?: 'roles' | 'strength'
}

function RoleList({ items }: { items: BeebePlacement[] }) {
  return (
    <ol className="beebe-list">
      {items.map((placement) => {
        const fn = FUNCTIONS[placement.functionId]
        return (
          <li
            key={placement.role.key}
            className={
              placement.role.ring === 'shadow' ? 'beebe-list__item is-shadow' : 'beebe-list__item'
            }
          >
            <span className="beebe-list__pos">{placement.position}</span>
            <div>
              <p className="beebe-list__role">
                {placement.role.full}
                <span className="beebe-list__ring">
                  {placement.role.ring === 'ego' ? 'conscious' : 'unconscious'}
                </span>
              </p>
              <p className="beebe-list__fn">
                <strong>{fn.id}</strong> {fn.name}
              </p>
              <p className="beebe-list__blurb">{placement.role.blurb}</p>
            </div>
            <span className="beebe-list__score">{placement.percent}%</span>
          </li>
        )
      })}
    </ol>
  )
}

export function BeebeStack({ placements, order = 'roles' }: BeebeStackProps) {
  if (order === 'strength') {
    const items = [...placements].sort((a, b) => b.percent - a.percent || a.position - b.position)
    return <RoleList items={items} />
  }

  const ego = placements.filter((item) => item.role.ring === 'ego')
  const shadow = placements.filter((item) => item.role.ring === 'shadow')

  return (
    <>
      <p className="beebe-ring-heading">The Ego Functions (Conscious)</p>
      <RoleList items={ego} />
      <p className="beebe-ring-heading">The Shadow Functions (Unconscious)</p>
      <RoleList items={shadow} />
    </>
  )
}
