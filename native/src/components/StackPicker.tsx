import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FUNCTIONS, type FunctionId } from '../../../src/data/functions'
import {
  closeLeaders,
  preferredParent,
  validParentsForHero,
  type FunctionScore,
} from '../../../src/lib/scoring'
import { SproutPortrait } from './SproutPortrait'
import { colors } from '../theme'
import { ui } from '../ui'

type StackPickerProps = {
  scores: FunctionScore[]
  hero: FunctionId
  parent: FunctionId
  preview?: {
    code: string
    title: string
    summary: string
  }
  onHeroChange: (hero: FunctionId) => void
  onParentChange: (parent: FunctionId) => void
  onOpenPreview?: (code: string) => void
}

export function StackPicker({
  scores,
  hero,
  parent,
  preview,
  onHeroChange,
  onParentChange,
  onOpenPreview,
}: StackPickerProps) {
  const percentById = Object.fromEntries(scores.map((score) => [score.id, score.percent])) as Record<
    FunctionId,
    number
  >
  const close = closeLeaders(scores)
  const parents = validParentsForHero(hero)
  const tied =
    close.length >= 2 &&
    Math.abs((percentById[close[0] ?? hero] ?? 0) - (percentById[close[1] ?? hero] ?? 0)) <= 12

  return (
    <View>
      <Text style={styles.intro}>
        {tied
          ? 'Two functions scored close. Pick the one that leads, then the one that supports it.'
          : 'Pick the function that leads, then the one that supports it.'}
      </Text>
      <RoleRow
        label="Leads"
        options={scores.map((score) => score.id)}
        selected={hero}
        percentById={percentById}
        close={close}
        suggestedId={scores[0]?.id}
        onPick={onHeroChange}
      />
      <RoleRow
        label="Supports"
        options={parents}
        selected={parent}
        percentById={percentById}
        close={parents}
        suggestedId={preferredParent(hero, scores)}
        onPick={onParentChange}
      />
      {preview ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${preview.code} ${preview.title}`}
          onPress={() => onOpenPreview?.(preview.code)}
          style={styles.preview}
        >
          <SproutPortrait code={preview.code} size={96} />
          <Text style={styles.previewTitle}>
            {preview.code} — {preview.title}
          </Text>
          <Text style={ui.stat}>
            {preview.code.toLowerCase()} · Hero / Heroine {hero} ({percentById[hero] ?? 0}%) · Parent {parent} (
            {percentById[parent] ?? 0}%)
          </Text>
          <Text style={styles.previewLede}>{preview.summary}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function RoleRow({
  label,
  options,
  selected,
  percentById,
  close,
  suggestedId,
  onPick,
}: {
  label: string
  options: FunctionId[]
  selected: FunctionId
  percentById: Record<FunctionId, number>
  close: FunctionId[]
  suggestedId?: FunctionId
  onPick: (id: FunctionId) => void
}) {
  return (
    <View style={styles.rowWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((id) => {
          const on = selected === id
          const isClose = close.includes(id)
          const suggested = suggestedId === id && id !== selected
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${FUNCTIONS[id].id}, ${percentById[id] ?? 0} percent`}
              onPress={() => onPick(id)}
              style={[styles.chip, on ? styles.chipOn : isClose ? styles.chipClose : null]}
            >
              <Text style={[styles.chipId, on ? styles.chipOnText : null]}>{FUNCTIONS[id].id}</Text>
              <Text style={[styles.chipPct, on ? styles.chipOnText : null]}>
                {percentById[id] ?? 0}%{suggested ? ' · stronger' : ''}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: 16,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  rowWrap: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 8,
    color: colors.ink,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 58,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  chipClose: {
    borderColor: colors.muted,
  },
  chipOn: {
    backgroundColor: colors.ink,
  },
  chipId: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  chipPct: {
    marginTop: 2,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 11,
  },
  chipOnText: {
    color: colors.bg,
  },
  preview: {
    marginTop: 8,
    paddingTop: 16,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  previewTitle: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  previewLede: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
})
