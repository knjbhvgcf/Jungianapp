import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  followUpQuestions,
  needsFollowUp,
  pairsNeedingFollowUp,
  type ClarifyAnswers,
} from '../../../src/lib/clarify'
import { isQuizComplete, type Answers } from '../../../src/lib/scoring'
import { colors } from '../theme'
import { loadAnswers, loadClarifyAnswers, saveClarifyAnswers } from '../storage'

const ADVANCE_MS = 160

type ClarifyScreenProps = {
  onFinished: () => void
  onQuiz: () => void
}

export function ClarifyScreen({ onFinished, onQuiz }: ClarifyScreenProps) {
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Answers | null>(null)
  const [answers, setAnswers] = useState<ClarifyAnswers>({})
  const [index, setIndex] = useState(0)

  useEffect(() => {
    void Promise.all([loadAnswers(), loadClarifyAnswers()]).then(([quiz, clarify]) => {
      setQuizAnswers(quiz)
      const questions = followUpQuestions(quiz)
      const firstUnanswered = questions.findIndex((item) => clarify[item.id] == null)
      setAnswers(clarify)
      setIndex(firstUnanswered === -1 ? 0 : firstUnanswered)
    })
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  const questions = useMemo(
    () => (quizAnswers ? followUpQuestions(quizAnswers) : []),
    [quizAnswers],
  )
  const pairs = useMemo(
    () => (quizAnswers ? pairsNeedingFollowUp(quizAnswers) : []),
    [quizAnswers],
  )

  useEffect(() => {
    if (!quizAnswers) return
    if (!isQuizComplete(quizAnswers)) {
      onQuiz()
      return
    }
    if (!followUpQuestions(quizAnswers).length) onFinished()
  }, [onFinished, onQuiz, quizAnswers])

  if (!quizAnswers) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Opening the follow-up…</Text>
      </View>
    )
  }

  if (!isQuizComplete(quizAnswers) || !questions.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Opening the follow-up…</Text>
      </View>
    )
  }

  const question = questions[index]
  if (!question) return null

  const currentValue = answers[question.id]
  const isLast = index === questions.length - 1
  const firstOption = index % 2 === 0 ? 'a' : 'b'
  const options =
    firstOption === 'a'
      ? [
          { id: question.a, text: question.aText },
          { id: question.b, text: question.bText },
        ]
      : [
          { id: question.b, text: question.bText },
          { id: question.a, text: question.aText },
        ]

  function goForward(nextAnswers: ClarifyAnswers) {
    if (!quizAnswers || nextAnswers[question.id] == null) return
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (isLast) {
      if (needsFollowUp(quizAnswers, nextAnswers)) return
      onFinished()
      return
    }
    setIndex((value) => value + 1)
  }

  function updateAnswer(value: typeof question.a | typeof question.b) {
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    void saveClarifyAnswers(next)
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => goForward(next), ADVANCE_MS)
  }

  const pairWords =
    pairs.length === 1
      ? (pairs[0]?.label ?? 'two answers')
      : pairs.map((pair) => pair.label).join(', ')

  return (
    <View style={styles.wrap}>
      <Text style={styles.progress}>
        Question {index + 1} of {questions.length}
      </Text>
      <ScrollView style={styles.promptScroll} contentContainerStyle={styles.promptContent}>
        <Text style={styles.note}>
          {pairs.length === 1
            ? 'Two answers were too close to name a type yet. Pick the sentence that sounds more like you.'
            : `${pairWords} were close. Pick the sentence that sounds more like you.`}
        </Text>
        <Text style={styles.prompt}>{question.prompt}</Text>
      </ScrollView>
      <View style={styles.dock}>
        <View style={styles.choices}>
          {options.map((option) => {
            const selected = currentValue === option.id
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => updateAnswer(option.id)}
                style={[styles.choice, selected ? styles.choiceOn : null]}
              >
                <Text style={[styles.choiceText, selected ? styles.choiceTextOn : null]}>
                  {option.text}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={index === 0}
          onPress={() => {
            if (advanceTimer.current) clearTimeout(advanceTimer.current)
            setIndex((value) => Math.max(0, value - 1))
          }}
          style={[styles.ghost, index === 0 ? styles.disabled : null]}
        >
          <Text style={styles.ghostText}>Back</Text>
        </Pressable>
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
    gap: 12,
  },
  progress: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 13,
    textAlign: 'center',
  },
  note: {
    marginTop: 14,
    marginBottom: 18,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  prompt: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 28,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  choices: {
    gap: 12,
  },
  choice: {
    minHeight: 88,
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 18,
  },
  choiceOn: {
    backgroundColor: colors.ink,
  },
  choiceText: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
  },
  choiceTextOn: {
    color: colors.bg,
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
  disabled: {
    opacity: 0.35,
  },
})
