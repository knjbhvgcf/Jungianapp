import { formatPopulationShare } from '../data/personalityTypes'
import { useEditMode } from '../lib/editMode'
import { Editable } from './Editable'

export function PopulationShare({
  percent,
  className,
  onChange,
}: {
  percent: number
  className?: string
  onChange?: (value: number) => void
}) {
  const { editing } = useEditMode()
  if (editing && onChange) {
    return (
      <span className={className}>
        about{' '}
        <Editable
          as="span"
          multiline={false}
          label="Population %"
          value={String(percent)}
          onChange={(raw) => {
            const n = Number(String(raw).replace(/[^0-9.]+/g, ''))
            if (Number.isFinite(n) && n >= 0 && n <= 100) onChange(n)
          }}
        />
        % of people
      </span>
    )
  }
  return <span className={className}>{formatPopulationShare(percent)}</span>
}
