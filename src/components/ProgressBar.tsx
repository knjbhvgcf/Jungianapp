type ProgressBarProps = {
  value: number
  max: number
  label: string
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = Math.round((value / max) * 100)

  return (
    <div className="progress">
      <div
        className="progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress__meta">
        <span>1</span>
        <span>{label}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
