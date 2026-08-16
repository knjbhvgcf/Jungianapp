import { FUNCTIONS } from '../data/functions'
import type { BeebePlacement } from '../lib/scoring'

type BeebeStackProps = {
  placements: BeebePlacement[]
  order?: 'roles' | 'strength'
}

export function BeebeStack({ placements, order = 'roles' }: BeebeStackProps) {
  const items =
    order === 'strength'
      ? [...placements].sort((a, b) => b.percent - a.percent || a.position - b.position)
      : placements
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
                <span className="beebe-list__ring">{placement.role.ring}</span>
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
