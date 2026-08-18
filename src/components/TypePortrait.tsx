import type { FunctionId } from '../data/functions'
import { Sketch } from './Sketch'

type TypePortraitProps = {
  hero: FunctionId
  image?: string
  className?: string
  alt?: string
}

export function TypePortrait({ hero, image, className = '', alt = '' }: TypePortraitProps) {
  if (image) {
    return <img src={image} alt={alt} className={`sketch type-portrait ${className}`} />
  }
  return <Sketch kind={hero} className={className} />
}
