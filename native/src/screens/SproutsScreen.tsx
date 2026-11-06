import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { PERSONALITY_TYPES } from '../../../src/data/personalityTypes'
import { SproutPortrait } from '../components/SproutPortrait'
import { colors } from '../theme'

type SproutsScreenProps = {
  onOpen: (code: string) => void
  onBack: () => void
  onQuiz: () => void
}

export function SproutsScreen({ onOpen, onBack, onQuiz }: SproutsScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>sprouts</Text>
      <Text style={styles.title}>Sixteen sprouts</Text>
      <Text style={styles.lede}>
        Each sprout is a leading function and the function that supports it. Meet them before the
        quiz, or come back after.
      </Text>
      <View style={styles.grid}>
        {PERSONALITY_TYPES.map((type) => (
          <Pressable
            key={type.code}
            accessibilityRole="button"
            accessibilityLabel={`${type.code} ${type.title}`}
            onPress={() => onOpen(type.code)}
            style={styles.card}
          >
            <SproutPortrait code={type.code} size={108} />
            <Text style={styles.code}>{type.code}</Text>
            <Text style={styles.name}>{type.title}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={onQuiz} style={styles.cta}>
        <Text style={styles.ctaText}>Begin the quiz</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.ghost}>
        <Text style={styles.ghostText}>Back</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 36,
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
    fontSize: 34,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  lede: {
    marginTop: 12,
    marginBottom: 18,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  code: {
    marginTop: 6,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  name: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cta: {
    marginTop: 12,
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
