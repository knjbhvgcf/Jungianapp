import { FUNCTIONS, type FunctionId } from '../../data/functions'
import type { HourSpan, HourWeather, ResultSnapshot } from './types'

export const HOUR_SPANS: { id: HourSpan; title: string; hint: string }[] = [
  { id: 'minutes', title: 'Minutes', hint: 'A short stretch' },
  { id: 'hour', title: 'An hour', hint: 'This stretch' },
  { id: 'day', title: 'The day', hint: 'Morning to night' },
]

export function spanLabel(span: HourSpan | undefined) {
  if (span === 'minutes') return 'minutes'
  if (span === 'day') return 'the day'
  return 'an hour'
}

function fn(id: FunctionId) {
  return `${id} (${FUNCTIONS[id].name.toLowerCase()})`
}

export function weatherHint(stack: ResultSnapshot['stack'], weather: HourWeather) {
  if (weather === 'ordinary') return `${stack[0]} + ${stack[1]}`
  if (weather === 'loop') return `${stack[0]} + ${stack[2]}`
  return stack[3]
}

export function weatherCopy(self: ResultSnapshot | null, weather: HourWeather) {
  if (!self) {
    if (weather === 'ordinary') {
      return {
        name: 'Ordinary',
        learn: 'Hero and Parent are in the room. Name your type on Me to see which functions that is.',
        hour: 'Keep the Parent in the room: one maybe, one walk.',
      }
    }
    if (weather === 'loop') {
      return {
        name: 'Loop',
        learn: 'Hero and Eternal Child. Parent offline. Comfort standing in for a choice.',
        hour: 'One unused tab, one walk without the usual route, one what-if that is not a plan.',
      }
    }
    return {
      name: 'Grip',
      learn: 'Inferior has the building. Hero is offline. It is stress, not a new type.',
      hour: 'Unload one responsibility. Restore the Hero. Do not retake the quiz and rename yourself from this hour.',
    }
  }

  const [hero, parent, child, anima] = self.stack

  if (weather === 'ordinary') {
    return {
      name: 'Ordinary',
      learn: `Hero and Parent are in the room. For you that is ${fn(hero)} and ${fn(parent)}. You know what matters. Options are open.`,
      hour: `Keep the Parent in the room: one maybe, one walk. Do not use a fine hour to work on ${fn(anima)}.`,
    }
  }
  if (weather === 'loop') {
    return {
      name: 'Loop',
      learn: `Hero and Eternal Child. Parent offline. ${fn(hero)} and ${fn(child)} nest. Comfort standing in for a choice.`,
      hour: 'One unused tab, one walk without the usual route, one what-if that is not a plan.',
    }
  }
  return {
    name: 'Grip',
    learn: `Inferior ${fn(anima)} has the building. ${fn(hero)} is offline. It is stress, not a new type.`,
    hour: `Unload one responsibility. Restore ${fn(hero)}. Do not retake the quiz and rename yourself from this hour.`,
  }
}
