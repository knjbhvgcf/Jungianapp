import { Image, View } from 'react-native'
import { SPROUT_PORTRAITS } from '../portraits'

type SproutPortraitProps = {
  code: string
  size?: number
  accessibilityLabel?: string
}

export function SproutPortrait({ code, size = 160, accessibilityLabel }: SproutPortraitProps) {
  const source = SPROUT_PORTRAITS[code.toUpperCase()]
  if (!source) return <View style={{ width: size, height: size }} />
  return (
    <Image
      source={source}
      accessibilityLabel={accessibilityLabel ?? `${code} sprout`}
      resizeMode="contain"
      style={{ width: size, height: size * 1.2 }}
    />
  )
}
