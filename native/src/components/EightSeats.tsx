import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BEEBE_ROLES, beebeStack } from '../../../src/data/beebe'
import { FUNCTIONS } from '../../../src/data/functions'
import type { HourWeather, ResultSnapshot } from '../../../src/lib/workspace/types'
import { colors } from '../theme'

const SHORT: Record<string, string> = {
  hero: 'Hero',
  parent: 'Parent',
  child: 'Child',
  anima: 'Inferior',
  opposing: 'Opposing',
  senex: 'Critic',
  trickster: 'Trickster',
  demon: 'Demon',
}

function hourOn(weather: HourWeather | null, index: number) {
  if (weather == null || index >= 4) return 'idle'
  const on =
    weather === 'ordinary'
      ? index === 0 || index === 1
      : weather === 'loop'
        ? index === 0 || index === 2
        : index === 3
  return on ? 'on' : 'off'
}

export function EightSeats({
  stack,
  percents,
  weather = null,
  selected,
  onSelect,
  caption,
}: {
  stack: ResultSnapshot['stack']
  percents?: ResultSnapshot['percents']
  weather?: HourWeather | null
  selected: number | null
  onSelect: (index: number) => void
  caption?: string
}) {
  const seats = beebeStack(stack)
  const role = selected != null ? BEEBE_ROLES[selected] : null
  const fn = selected != null ? seats[selected] : null

  return (
    <View style={styles.wrap}>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      <Text style={styles.ring}>Ego</Text>
      <View style={styles.grid}>
        {seats.slice(0, 4).map((id, index) => (
          <Seat
            key={id + index}
            index={index}
            id={id}
            percent={percents?.[id]}
            weather={weather}
            selected={selected === index}
            onSelect={onSelect}
          />
        ))}
      </View>
      <Text style={styles.ring}>Shadow</Text>
      <View style={styles.grid}>
        {seats.slice(4).map((id, index) => {
          const at = index + 4
          return (
            <Seat
              key={id + at}
              index={at}
              id={id}
              percent={percents?.[id]}
              weather={weather}
              selected={selected === at}
              onSelect={onSelect}
            />
          )
        })}
      </View>
      {role && fn ? (
        <View style={styles.rail}>
          <Text style={styles.kicker}>
            {fn} · {role.label}
            {typeof percents?.[fn] === 'number' ? ` · ${percents[fn]}%` : ''}
          </Text>
          <Text style={styles.body}>{role.blurb}</Text>
          <Text style={styles.body}>
            {FUNCTIONS[fn].name}. {FUNCTIONS[fn].summary}
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>Tap a seat.</Text>
      )}
    </View>
  )
}

function Seat({
  index,
  id,
  percent,
  weather,
  selected,
  onSelect,
}: {
  index: number
  id: string
  percent?: number
  weather: HourWeather | null
  selected: boolean
  onSelect: (index: number) => void
}) {
  const role = BEEBE_ROLES[index]
  const hour = hourOn(weather, index)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${id}, ${role.label}${typeof percent === 'number' ? `, ${percent}%` : ''}`}
      onPress={() => onSelect(index)}
      style={[
        styles.seat,
        hour === 'on' ? styles.seatLit : null,
        hour === 'off' ? styles.seatDim : null,
        selected ? styles.seatOn : null,
      ]}
    >
      <Text style={[styles.fn, selected ? styles.fnOn : null]}>{id}</Text>
      <Text style={[styles.role, selected ? styles.roleOn : null]}>{SHORT[role.key] ?? role.label}</Text>
      {typeof percent === 'number' ? (
        <Text style={[styles.pct, selected ? styles.roleOn : null]}>{percent}%</Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  caption: {
    marginBottom: 10,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  ring: {
    marginBottom: 8,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  seat: {
    width: '47%',
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  seatLit: {
    backgroundColor: '#2a2a2a',
  },
  seatDim: {
    opacity: 0.4,
  },
  seatOn: {
    backgroundColor: colors.ink,
  },
  fn: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  fnOn: {
    color: colors.bg,
  },
  role: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
  },
  roleOn: {
    color: colors.bg,
  },
  pct: {
    marginTop: 2,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
  },
  rail: {
    gap: 8,
  },
  kicker: {
    color: colors.ink,
    fontFamily: 'Courier',
    fontSize: 13,
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    color: colors.faint,
    fontSize: 14,
    textAlign: 'center',
  },
})
