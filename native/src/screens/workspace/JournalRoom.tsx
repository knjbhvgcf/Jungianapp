import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { typeByCode } from '../../../../src/data/personalityTypes'
import type { HourSpan, HourWeather, WorkspaceHouse } from '../../../../src/lib/workspace/types'
import { HOUR_SPANS, spanLabel, weatherCopy, weatherHint } from '../../../../src/lib/workspace/weather'
import { EightSeats } from '../../components/EightSeats'
import { addHour } from '../../house'
import { colors } from '../../theme'
import { ui } from '../../ui'

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function JournalRoom({ house }: { house: WorkspaceHouse }) {
  const [weather, setWeather] = useState<HourWeather | null>(null)
  const [span, setSpan] = useState<HourSpan>('hour')
  const [note, setNote] = useState('')
  const [seat, setSeat] = useState<number | null>(null)
  const self = house.self
  const selfType = self ? typeByCode(self.code) : undefined
  const copy = weather ? weatherCopy(self, weather) : null
  const tiles: { id: HourWeather; title: string; hint: string }[] = useMemo(
    () =>
      self
        ? [
            { id: 'ordinary', title: 'Ordinary', hint: weatherHint(self.stack, 'ordinary') },
            { id: 'loop', title: 'Loop', hint: weatherHint(self.stack, 'loop') },
            { id: 'grip', title: 'Grip', hint: weatherHint(self.stack, 'grip') },
          ]
        : [
            { id: 'ordinary', title: 'Ordinary', hint: 'Hero + Parent' },
            { id: 'loop', title: 'Loop', hint: 'Hero + Child' },
            { id: 'grip', title: 'Grip', hint: 'Inferior' },
          ],
    [self],
  )

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      <Text style={ui.eyebrow}>Journal</Text>
      <Text style={ui.title}>How is this hour?</Text>
      {self ? (
        <Text style={ui.stat}>
          {self.code}
          {selfType ? ` · ${selfType.title}` : ''}
        </Text>
      ) : (
        <Text style={ui.note}>Name a type on Me first. Ordinary, loop, and grip follow that stack.</Text>
      )}
      <View style={styles.tiles}>
        {tiles.map((tile) => {
          const on = weather === tile.id
          return (
            <Pressable
              key={tile.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setWeather((current) => (current === tile.id ? null : tile.id))}
              style={[styles.tile, on ? styles.tileOn : null]}
            >
              <Text style={[styles.tileTitle, on ? styles.onText : null]}>{tile.title}</Text>
              <Text style={[styles.tileHint, on ? styles.onText : null]}>{tile.hint}</Text>
            </Pressable>
          )
        })}
      </View>
      {copy ? (
        <View style={styles.band}>
          <Text style={ui.lede}>{copy.learn}</Text>
          <Text style={styles.body}>
            <Text style={styles.strong}>
              {span === 'day' ? 'This day. ' : span === 'minutes' ? 'These minutes. ' : 'This hour. '}
            </Text>
            {copy.hour}
          </Text>
          <Text style={styles.caption}>How long</Text>
          <View style={styles.tiles}>
            {HOUR_SPANS.map((item) => {
              const on = span === item.id
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setSpan(item.id)}
                  style={[styles.tile, on ? styles.tileOn : null]}
                >
                  <Text style={[styles.tileTitle, on ? styles.onText : null]}>{item.title}</Text>
                  <Text style={[styles.tileHint, on ? styles.onText : null]}>{item.hint}</Text>
                </Pressable>
              )
            })}
          </View>
          <View style={ui.field}>
            <Text style={ui.label}>Optional note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What happened"
              placeholderTextColor={colors.faint}
              style={ui.input}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!weather) return
              void addHour(weather, note.trim(), self, span)
              setNote('')
            }}
            style={ui.cta}
          >
            <Text style={ui.ctaText}>
              {span === 'day' ? 'Keep this day' : span === 'minutes' ? 'Keep these minutes' : 'Keep this hour'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={ui.lede}>Tap ordinary, loop, or grip. Then how long it lasted.</Text>
      )}
      {self && weather ? (
        <EightSeats
          stack={self.stack}
          percents={self.percents}
          weather={weather}
          selected={seat}
          onSelect={(index) => setSeat((current) => (current === index ? null : index))}
          caption={`${copy?.name ?? weather}. Lit seats are who is on stage for ${self.code}.`}
        />
      ) : null}
      {house.hours.map((tag) => {
        const hint = tag.hint ?? (self ? weatherHint(self.stack, tag.weather) : undefined)
        const on = weather === tag.weather
        return (
          <Pressable
            key={tag.id}
            accessibilityRole="button"
            onPress={() => setWeather((current) => (current === tag.weather ? null : tag.weather))}
            style={[styles.hour, on ? styles.hourOn : null]}
          >
            <Text style={styles.hourDay}>{formatDay(tag.at)}</Text>
            <Text style={styles.hourWeather}>{tag.weather}</Text>
            <Text style={styles.hourMeta}>{spanLabel(tag.span)}</Text>
            {hint ? <Text style={styles.hourMeta}>{hint}</Text> : null}
            {tag.note ? <Text style={styles.hourNote}>{tag.note}</Text> : null}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tile: {
    width: '31%',
    minHeight: 72,
    padding: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  tileOn: {
    backgroundColor: colors.ink,
  },
  tileTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  tileHint: {
    marginTop: 4,
    color: colors.faint,
    fontSize: 12,
  },
  onText: {
    color: colors.bg,
  },
  band: {
    marginBottom: 16,
  },
  body: {
    marginBottom: 14,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  strong: {
    color: colors.ink,
    fontWeight: '700',
  },
  caption: {
    marginBottom: 8,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  hour: {
    marginBottom: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  hourOn: {
    backgroundColor: colors.dim,
  },
  hourDay: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
  },
  hourWeather: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 16,
    textTransform: 'capitalize',
  },
  hourMeta: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 13,
  },
  hourNote: {
    marginTop: 6,
    color: colors.ink,
    fontStyle: 'italic',
    fontSize: 15,
  },
})
