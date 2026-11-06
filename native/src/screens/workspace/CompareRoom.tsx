import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FUNCTIONS } from '../../../../src/data/functions'
import { PERSONALITY_TYPES } from '../../../../src/data/personalityTypes'
import { isFigure } from '../../../../src/lib/workspace/circle'
import { pickMe, pickPerson, pickType, resolvePick } from '../../../../src/lib/workspace/compatPick'
import {
  compareCaption,
  compareView,
  PLACE,
  scoreLabel,
} from '../../../../src/lib/workspace/compareView'
import type { ResultSnapshot, WorkspaceHouse } from '../../../../src/lib/workspace/types'
import { OptionSheet } from '../../components/OptionSheet'
import { SproutPortrait } from '../../components/SproutPortrait'
import { colors } from '../../theme'
import { ui } from '../../ui'

export function CompareRoom({
  house,
  rightValue,
  onRightValue,
}: {
  house: WorkspaceHouse
  rightValue: string
  onRightValue: (value: string) => void
}) {
  const [leftValue, setLeftValue] = useState(pickMe())
  const [picking, setPicking] = useState<'left' | 'right' | null>(null)
  const self = house.self
  const people = house.people
  const friends = people.filter((person) => !isFigure(person))
  const figures = people.filter(isFigure)
  const groups = useMemo(
    () => [
      {
        label: 'People',
        items: [
          { value: pickMe(), label: self ? `Me · ${self.code}` : 'Me', disabled: !self },
          ...friends.map((person) => ({
            value: pickPerson(person.id),
            label: person.code ? `${person.name} · ${person.code}` : `${person.name} · waiting on quiz`,
            disabled: !person.code,
          })),
        ],
      },
      ...(figures.length
        ? [
            {
              label: 'Public figures',
              items: figures.map((person) => ({
                value: pickPerson(person.id),
                label: person.code ? `${person.name} · ${person.code}` : person.name,
                disabled: !person.code,
              })),
            },
          ]
        : []),
      {
        label: 'Types',
        items: PERSONALITY_TYPES.map((type) => ({
          value: pickType(type.code),
          label: `${type.code} · ${type.title}`,
        })),
      },
    ],
    [figures, friends, self],
  )
  const left = resolvePick(leftValue, self, people)
  const right = resolvePick(rightValue, self, people)

  useEffect(() => {
    if (rightValue) return
    const named = people.find((person) => person.code)
    if (named) onRightValue(pickPerson(named.id))
  }, [onRightValue, people, rightValue])

  function swap() {
    const nextLeft = rightValue
    onRightValue(leftValue)
    setLeftValue(nextLeft || pickMe())
  }

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      <Text style={ui.eyebrow}>Compare</Text>
      <Text style={ui.title}>Pick two</Text>
      <Text style={ui.lede}>People you've added, public figures, or any of the sixteen types.</Text>
      <View style={ui.field}>
        <Text style={ui.label}>This one</Text>
        <Pressable accessibilityRole="button" onPress={() => setPicking('left')} style={ui.ghost}>
          <Text style={ui.ghostText}>{left ? labelFor(left, self) : 'Choose'}</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={swap} style={styles.swap}>
        <Text style={styles.swapText}>Swap</Text>
      </Pressable>
      <View style={ui.field}>
        <Text style={ui.label}>With</Text>
        <Pressable accessibilityRole="button" onPress={() => setPicking('right')} style={ui.ghost}>
          <Text style={ui.ghostText}>{right ? labelFor(right, self) : 'Choose'}</Text>
        </Pressable>
      </View>
      {left && right ? (
        <Pair left={left} right={right} />
      ) : (
        <Text style={ui.note}>
          {self ? 'Pick someone or a type on the right.' : 'Name a type on Me, or pick two from the lists.'}
        </Text>
      )}
      <OptionSheet
        visible={picking === 'left'}
        title="This one"
        value={leftValue}
        groups={groups}
        onPick={setLeftValue}
        onClose={() => setPicking(null)}
      />
      <OptionSheet
        visible={picking === 'right'}
        title="With"
        value={rightValue}
        groups={groups}
        onPick={onRightValue}
        onClose={() => setPicking(null)}
      />
    </ScrollView>
  )
}

function labelFor(
  pick: { name: string; type: { code: string; title: string } },
  self: ResultSnapshot | null,
) {
  if (pick.name === 'Me') return self ? `Me · ${self.code}` : 'Me'
  if (PERSONALITY_TYPES.some((type) => type.title === pick.name && type.code === pick.type.code)) {
    return `${pick.type.code} · ${pick.type.title}`
  }
  return `${pick.name} · ${pick.type.code}`
}

function Pair({
  left,
  right,
}: {
  left: NonNullable<ReturnType<typeof resolvePick>>
  right: NonNullable<ReturnType<typeof resolvePick>>
}) {
  const view = compareView(left, right)
  const [open, setOpen] = useState<number | null>(view.inLeftIndex >= 0 ? view.inLeftIndex : 0)
  const [more, setMore] = useState(false)
  const seat = open != null ? view.seats[open] : null

  useEffect(() => {
    setOpen(view.inLeftIndex >= 0 ? view.inLeftIndex : 0)
    setMore(false)
  }, [left.name, left.type.code, right.name, right.type.code, view.inLeftIndex])

  return (
    <View>
      {view.inLeftIndex >= 0 ? (
        <Text style={ui.lede}>
          {view.rightName === 'you' ? 'You' : view.rightName} lead{view.rightName === 'you' ? '' : 's'} with{' '}
          {right.type.stack[0]}. In {view.leftName} that is {view.seats[view.inLeftIndex]?.full}.
          {view.inRightIndex >= 0
            ? ` ${view.leftName === 'you' ? 'You' : view.leftName} lead${view.leftName === 'you' ? '' : 's'} with ${left.type.stack[0]}. In ${view.rightName} that is ${view.seats[view.inRightIndex]?.full}.`
            : ''}
        </Text>
      ) : null}
      <Text style={ui.stat}>
        {view.reading.label}
        {view.reading.charge ? ` · ${view.reading.charge}` : ''}
      </Text>
      <Text style={ui.lede}>{view.reading.note}</Text>
      <View style={styles.faces}>
        <View style={styles.face}>
          <SproutPortrait code={left.type.code} size={108} />
          <Text style={styles.caption}>{compareCaption(left)}</Text>
        </View>
        <View style={styles.face}>
          <SproutPortrait code={right.type.code} size={108} />
          <Text style={styles.caption}>{compareCaption(right)}</Text>
        </View>
      </View>
      <View style={styles.head}>
        <Text style={styles.headSeat} />
        <Text numberOfLines={1} style={styles.headName}>
          {view.leftLabel}
        </Text>
        <Text numberOfLines={1} style={styles.headName}>
          {view.rightLabel}
        </Text>
      </View>
      {view.seats.map((row) => (
        <View key={row.index}>
          {row.index === 0 ? <Text style={styles.ring}>Ego</Text> : null}
          {row.index === 4 ? <Text style={styles.ring}>Shadow</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: open === row.index }}
            onPress={() => setOpen(row.index)}
            style={[styles.row, open === row.index ? styles.rowOn : null]}
          >
            <Text style={[styles.role, open === row.index ? styles.onInk : null]}>{row.short}</Text>
            <View style={styles.cell}>
              <Text style={[styles.fn, open === row.index ? styles.onInk : null]}>
                {scoreLabel(row.leftFn, row.leftPct)}
              </Text>
              {row.markLeft ? (
                <Text style={[styles.mark, open === row.index ? styles.onInk : null]}>{row.markLeft}</Text>
              ) : null}
            </View>
            <View style={styles.cell}>
              <Text style={[styles.fn, open === row.index ? styles.onInk : null]}>
                {scoreLabel(row.rightFn, row.rightPct)}
              </Text>
              {row.markRight ? (
                <Text style={[styles.mark, open === row.index ? styles.onInk : null]}>{row.markRight}</Text>
              ) : null}
            </View>
          </Pressable>
        </View>
      ))}
      {seat ? (
        <View style={styles.rail}>
          <Text style={styles.kicker}>{seat.full}</Text>
          <Text style={styles.body}>
            {view.leftName === 'you' ? 'You' : view.leftName}: {scoreLabel(seat.leftFn, seat.leftPct)}.{' '}
            {view.rightName === 'you' ? 'You' : view.rightName}: {scoreLabel(seat.rightFn, seat.rightPct)}.
          </Text>
          <Text style={styles.body}>{seat.blurb}</Text>
          <Text style={styles.body}>
            {FUNCTIONS[seat.leftFn].name}. {FUNCTIONS[seat.leftFn].summary}
          </Text>
          {seat.rightFn !== seat.leftFn ? (
            <Text style={styles.body}>
              {FUNCTIONS[seat.rightFn].name}. {FUNCTIONS[seat.rightFn].summary}
            </Text>
          ) : null}
          {open === view.inLeftIndex ? <Text style={styles.body}>{PLACE[view.reading.kind]}</Text> : null}
          {open === view.inRightIndex && view.inRightIndex !== view.inLeftIndex ? (
            <Text style={styles.body}>{PLACE[view.reverse.kind]}</Text>
          ) : null}
        </View>
      ) : (
        <Text style={ui.note}>Tap a seat. Same row is the same seat in both.</Text>
      )}
      {view.gaps.length ? (
        <Text style={ui.note}>
          Where the eight differ
          {view.gaps.map((gap) => ` · ${gap.id} ${gap.left}% / ${gap.right}%`).join('')}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: more }}
        onPress={() => setMore((value) => !value)}
        style={[ui.ghost, styles.more]}
      >
        <Text style={ui.ghostText}>{more ? 'Close' : 'The longer reading'}</Text>
      </Pressable>
      {more ? <Text style={ui.lede}>{view.reading.detail}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  swap: {
    alignSelf: 'center',
    marginTop: -4,
    marginBottom: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  swapText: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  faces: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  face: {
    flex: 1,
    alignItems: 'center',
  },
  caption: {
    marginTop: 6,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 11,
    textAlign: 'center',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  headSeat: {
    width: 72,
  },
  headName: {
    flex: 1,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  ring: {
    marginTop: 8,
    marginBottom: 6,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  rowOn: {
    backgroundColor: colors.ink,
  },
  role: {
    width: 72,
    color: colors.muted,
    fontSize: 12,
  },
  cell: {
    flex: 1,
  },
  fn: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  mark: {
    marginTop: 2,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 10,
  },
  onInk: {
    color: colors.bg,
  },
  rail: {
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
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
  more: {
    marginTop: 8,
  },
})
