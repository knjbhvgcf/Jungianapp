import type { CognitiveFunction } from '../data/functions'

type FunctionCardProps = {
  fn: CognitiveFunction
  compact?: boolean
}

export function FunctionCard({ fn, compact = false }: FunctionCardProps) {
  return (
    <article className={compact ? 'function-card function-card--compact' : 'function-card'}>
      <div className="function-card__badge">{fn.id}</div>
      <h3>{fn.name}</h3>
      <p className="function-card__role">{fn.role}</p>
      <p>{compact ? fn.summary : fn.description}</p>
    </article>
  )
}
