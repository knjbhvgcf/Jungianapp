import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { QUESTIONS } from '../../../src/data/questions'
import { isQuizComplete, type Answers } from '../../../src/lib/scoring'
import { Likert } from '../components/Likert'
import { colors } from '../theme'
import { loadAnswers, markCompleted, saveAnswers } from '../storage'

const ADVANCE_MS = 160

type QuizScreenProps = {
  onFinished: (answers: Answers) => void
  onHome: () => void
}

export function QuizScreen({ onFinished, onHome }: QuizScreenProps) {
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ready, setReady] = useState(false)
  const [answers, setAnswers] = useState<Answers>({})
  const [index, setIndex] = useState(0)
  const [showResume, setShowResume] = useState(false)

  useEffect(() => {
    void loadAnswers().then((stored) => {
      const firstUnanswered = QUESTIONS.findIndex((item) => stored[item.id] == null)
      const count = QUESTIONS.filter((item) => stored[item.id] != null).length
      setAnswers(stored)
      setIndex(firstUnanswered === -1 ? 0 : firstUnanswered)
      setShowResume(count > 0 && count < QUESTIONS.length)
      setReady(true)
    })
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  const answeredCount = useMemo(
    () => QUESTIONS.filter((item) => answers[item.id] != null).length,
    [answers],
  )
  const question = QUESTIONS[index]

  if (!ready || !question) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Opening the quiz…</Text>
      </View>
    )
  }

  const currentValue = answers[question.id]
  const isLast = index === QUESTIONS.length - 1

  function goForward(nextAnswers: Answers) {
    if (nextAnswers[question.id] == null) return
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (isLast) {
      if (!isQuizComplete(nextAnswers)) return
      void markCompleted()
      onFinished(nextAnswers)
      return
    }
    setIndex((value) => value + 1)
  }

  function choose(value: number) {
    setShowResume(false)
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    void saveAnswers(next)
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => goForward(next), ADVANCE_MS)
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.progress}>
        Question {index + 1} of {QUESTIONS.length}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(answeredCount / QUESTIONS.length) * 100}%` }]} />
      </View>
      <ScrollView
        style={styles.promptScroll}
        contentContainerStyle={styles.promptContent}
        keyboardShouldPersistTaps="handled"
      >
        {showResume ? (
          <Text style={styles.note}>
            You left off here.{' '}
            <Text style={styles.link} onPress={onHome}>
              Back to home
            </Text>
            .
          </Text>
        ) : null}
        <Text style={styles.prompt}>{question.text}</Text>
      </ScrollView>
      <View style={styles.dock}>
        <Likert key={QUESTIONS[index]?.id ?? index} value={currentValue} onChange={choose} />
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            disabled={index === 0}
            onPress={() => {
              setShowResume(false)
              if (advanceTimer.current) clearTimeout(advanceTimer.current)
              setIndex((value) => Math.max(0, value - 1))
            }}
            style={[styles.ghost, index === 0 ? styles.disabled : null]}
          >
            <Text style={styles.ghostText}>Back</Text>
          </Pressable>
          <View style={styles.navSlot}>
            {currentValue != null ? (
              <Pressable accessibilityRole="button" onPress={() => goForward(answers)} style={styles.cta}>
                <Text style={styles.ctaText}>{isLast ? 'See results' : 'Next'}</Text>
              </Pressable>
            ) : (
              <Text style={styles.hint}>Tap a number to continue</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  promptScroll: {
    flex: 1,
    minHeight: 0,
  },
  promptContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  dock: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 16,
  },
  progress: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 13,
    textAlign: 'center',
  },
  track: {
    height: 4,
    marginTop: 10,
    marginBottom: 18,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#2a2a2a',
  },
  fill: {
    height: 4,
    backgroundColor: colors.fill,
  },
  note: {
    marginBottom: 16,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  link: {
    textDecorationLine: 'underline',
    color: colors.ink,
  },
  prompt: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 30,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  nav: {
    gap: 12,
  },
  navSlot: {
    minHeight: 48,
    justifyContent: 'center',
  },
  ghost: {
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
  cta: {
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
  hint: {
    color: colors.faint,
    fontSize: 14,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
})
