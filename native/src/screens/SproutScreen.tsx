import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FUNCTIONS } from '../../../src/data/functions'
import { typeByCode } from '../../../src/data/personalityTypes'
import { SproutPortrait } from '../components/SproutPortrait'
import { colors } from '../theme'

const STACK_LABELS = ['Hero / Heroine', 'Parent', 'Eternal Child', 'Inferior (Anima / Animus)'] as const

type SproutScreenProps = {
  code: string
  onBack: () => void
  onAll: () => void
  onQuiz: () => void
}

export function SproutScreen({ code, onBack, onAll, onQuiz }: SproutScreenProps) {
  const selected = typeByCode(code)
  if (!selected) {
    return (
      <View style={styles.center}>
        <Text style={styles.lede}>That sprout is not here.</Text>
        <Pressable accessibilityRole="button" onPress={onAll} style={styles.ghost}>
          <Text style={styles.ghostText}>All sprouts</Text>
        </Pressable>
      </View>
    )
  }

  const hero = selected.stack[0]
  const parent = selected.stack[1]

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.ghostText}>Back</Text>
      </Pressable>
      <View style={styles.portrait}>
        <SproutPortrait code={selected.code} size={188} accessibilityLabel={`${selected.code} ${selected.title}`} />
      </View>
      <Text style={styles.eyebrow}>sprout</Text>
      <Text style={styles.title}>
        {selected.code} — {selected.title}
      </Text>
      <Text style={styles.stat}>
        {selected.code.toLowerCase()} · {selected.name.toLowerCase()} · {hero} → {parent}
      </Text>
      <Text style={styles.lede}>{selected.summary}</Text>
      <Text style={styles.heading}>Cognitive stack</Text>
      {selected.stack.map((id, position) => (
        <View key={id} style={styles.row}>
          <Text style={styles.role}>{STACK_LABELS[position]}</Text>
          <Text style={styles.fn}>
            {id} — {FUNCTIONS[id].name}
          </Text>
        </View>
      ))}
      <Pressable accessibilityRole="button" onPress={onQuiz} style={styles.cta}>
        <Text style={styles.ctaText}>Begin the quiz</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onAll} style={styles.ghost}>
        <Text style={styles.ghostText}>All sprouts</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 36,
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  portrait: {
    alignItems: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 28,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stat: {
    marginTop: 8,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 13,
    textAlign: 'center',
  },
  lede: {
    marginTop: 16,
    marginBottom: 24,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  heading: {
    marginBottom: 12,
    color: colors.ink,
    fontSize: 18,
  },
  row: {
    marginBottom: 12,
  },
  role: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fn: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
  },
  cta: {
    marginTop: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  ctaText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  ghost: {
    marginTop: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  ghostText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
