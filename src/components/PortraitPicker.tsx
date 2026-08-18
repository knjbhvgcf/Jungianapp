import { TypePortrait } from './TypePortrait'
import type { FunctionId } from '../data/functions'
import { portraitSrc, type PortraitSex } from '../lib/portrait'

const OPTIONS: { sex: PortraitSex; label: string }[] = [
  { sex: 'female', label: 'Female' },
  { sex: 'male', label: 'Male' },
]

type PortraitPickerProps = {
  code: string
  hero: FunctionId
  title: string
  fallbackImage?: string
  selected?: PortraitSex | null
  onPick: (sex: PortraitSex) => void
}

export function PortraitPicker({
  code,
  hero,
  title,
  fallbackImage,
  selected,
  onPick,
}: PortraitPickerProps) {
  return (
    <div className="portrait-pick" role="group" aria-label="Which portrait is yours?">
      {OPTIONS.map((option) => {
        const active = selected === option.sex
        return (
          <button
            key={option.sex}
            type="button"
            className={active ? 'portrait-pick__btn is-selected' : 'portrait-pick__btn'}
            onClick={() => onPick(option.sex)}
          >
            <TypePortrait
              hero={hero}
              image={portraitSrc(code, option.sex, fallbackImage)}
              alt={`${title}, ${option.label.toLowerCase()} portrait`}
            />
            <strong>{option.label}</strong>
          </button>
        )
      })}
    </div>
  )
}
