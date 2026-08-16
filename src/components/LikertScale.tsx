import { LIKERT_LABELS } from '../data/questions'

type LikertScaleProps = {
  name: string
  value?: number
  onChange: (value: number) => void
}

export function LikertScale({ name, value, onChange }: LikertScaleProps) {
  return (
    <fieldset className="likert">
      <legend className="sr-only">How much does this describe you?</legend>
      <p className="likert__hint">1 strongly disagree · 5 strongly agree</p>
      <div className="likert__row">
        {LIKERT_LABELS.map((option) => {
          const id = `${name}-${option.value}`
          return (
            <label key={option.value} htmlFor={id} className="likert__option">
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <span className="likert__value" aria-hidden="true">
                {option.value}
              </span>
              <span className="likert__label">{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
