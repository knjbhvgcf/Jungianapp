import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { QUESTIONS } from '../../../src/data/questions'
import { SproutPortrait } from '../components/SproutPortrait'
import { colors } from '../theme'

const HOME_SPROUT = 'INFJ'

type HomeScreenProps = {
  inProgress: boolean
  onBegin: () => void
  onSprouts: () => void
  onSprout: (code: string) => void
  onRooms: () => void
}

export function HomeScreen({ inProgress, onBegin, onSprouts, onSprout, onRooms }: HomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="INFJ Mystic"
        onPress={() => onSprout(HOME_SPROUT)}
        style={styles.wizard}
      >
        <SproutPortrait code={HOME_SPROUT} size={220} accessibilityLabel="INFJ Mystic" />
      </Pressable>
      <Text style={styles.eyebrow}>Jungology App</Text>
      <Text style={styles.title}>Jungology</Text>
      <Text style={styles.stat}>8 functions · {QUESTIONS.length} questions</Text>
      <Text style={styles.lede}>
        Rate fifty-two statements. Scores stay on this phone. Nothing is sent.
      </Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onBegin} style={styles.cta}>
          <Text style={styles.ctaText}>{inProgress ? 'Continue the quiz' : 'Begin the quiz'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onRooms} style={styles.ghost}>
          <Text style={styles.ghostText}>Open rooms</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSprouts} style={styles.ghost}>
          <Text style={styles.ghostText}>Sixteen sprouts</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  wizard: {
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
    color: colors.ink,
    fontSize: 42,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stat: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 14,
    textAlign: 'center',
  },
  lede: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    marginTop: 28,
    gap: 12,
  },
  cta: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  ctaText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  ghost: {
    minHeight: 54,
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
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
})
