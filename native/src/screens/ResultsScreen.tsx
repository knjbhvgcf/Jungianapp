import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FUNCTIONS } from '../../../src/data/functions'
import { applyFollowUpToProfile, needsFollowUp } from '../../../src/lib/clarify'
import {
  buildProfile,
  isQuizComplete,
  matchForSpine,
  preferredParent,
  validParentsForHero,
} from '../../../src/lib/scoring'
import { ScoreRow } from '../components/ScoreRow'
import { SproutPortrait } from '../components/SproutPortrait'
import { colors } from '../theme'
import { keepQuizSnapshot } from '../house'
import { sendInviteSnapshot } from '../../../src/lib/workspace/inviteClient'
import { clearInviteToken, loadInviteToken } from '../invite'
import { loadResultSnapshot } from '../snapshot'
import {
  clearQuiz,
  loadAnswers,
  loadClarifyAnswers,
  loadStackChoice,
} from '../storage'

type ResultsScreenProps = {
  onRestart: () => void
  onClarify: () => void
  onQuiz: () => void
  onSprout: (code: string) => void
  onSprouts: () => void
  onRooms: () => void
}

export function ResultsScreen({
  onRestart,
  onClarify,
  onQuiz,
  onSprout,
  onSprouts,
  onRooms,
}: ResultsScreenProps) {
  const [ready, setReady] = useState(false)
  const [answers, setAnswers] = useState<Awaited<ReturnType<typeof loadAnswers>>>({})
  const [clarify, setClarify] = useState<Awaited<ReturnType<typeof loadClarifyAnswers>>>({})
  const [stored, setStored] = useState<Awaited<ReturnType<typeof loadStackChoice>>>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteNote, setInviteNote] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)

  useEffect(() => {
    void Promise.all([loadAnswers(), loadClarifyAnswers(), loadStackChoice(), loadInviteToken()]).then(
      ([nextAnswers, nextClarify, nextStored, nextInvite]) => {
        setAnswers(nextAnswers)
        setClarify(nextClarify)
        setStored(nextStored)
        setInviteToken(nextInvite)
        setReady(true)
      },
    )
  }, [])

  const complete = isQuizComplete(answers)
  const profile = useMemo(() => {
    if (!complete) return null
    return applyFollowUpToProfile(buildProfile(answers), clarify)
  }, [answers, clarify, complete])

  useEffect(() => {
    if (!ready) return
    if (!complete) {
      onQuiz()
      return
    }
    if (needsFollowUp(answers, clarify)) onClarify()
  }, [answers, clarify, complete, onClarify, onQuiz, ready])

  if (!ready || !complete || needsFollowUp(answers, clarify)) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Opening results…</Text>
      </View>
    )
  }

  if (!profile?.matches[0]) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Could not name a type from those answers.</Text>
      </View>
    )
  }

  const top = profile.matches[0]
  const hero = stored?.hero ?? top.stack[0]
  const parents = validParentsForHero(hero)
  const parent =
    stored && stored.hero === hero && parents.includes(stored.parent)
      ? stored.parent
      : preferredParent(hero, profile.scores, profile.pairs)
  const selected = matchForSpine(profile.matches, hero, parent) ?? top
  const heroFn = FUNCTIONS[selected.stack[0]]?.id ?? selected.stack[0]
  const parentFn = FUNCTIONS[selected.stack[1]]?.id ?? selected.stack[1]
  const leadScore = profile.scores.find((score) => score.id === selected.stack[0])

  async function restart() {
    await clearQuiz()
    onRestart()
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>closest type</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Meet ${selected.code} ${selected.title}`}
        onPress={() => onSprout(selected.code)}
        style={styles.portrait}
      >
        <SproutPortrait
          code={selected.code}
          size={168}
          accessibilityLabel={`${selected.code} ${selected.title}`}
        />
      </Pressable>
      <Text style={styles.code}>{selected.code}</Text>
      <Text style={styles.title}>{selected.title}</Text>
      <Text style={styles.stat}>
        {selected.code.toLowerCase()} · {heroFn}
        {leadScore ? ` ${leadScore.percent}%` : ''} with {parentFn}
      </Text>
      <Text style={styles.lede}>{selected.summary}</Text>
      <Text style={styles.heading}>Eight scores</Text>
      {profile.scores.map((score) => (
        <ScoreRow key={score.id} score={score} />
      ))}
      <Text style={styles.note}>Answers stayed on this phone.</Text>
      {inviteToken && !inviteNote.startsWith('Sent') ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setInviteBusy(true)
            void loadResultSnapshot().then(async (snapshot) => {
              if (!snapshot) {
                setInviteBusy(false)
                setInviteNote('Need a type and the eight percentages.')
                return
              }
              const result = await sendInviteSnapshot(inviteToken, snapshot)
              setInviteBusy(false)
              if (result.ok) {
                await clearInviteToken()
                setInviteNote('Sent. They get a ping.')
                return
              }
              setInviteNote(result.error)
            })
          }}
          style={styles.ghost}
        >
          <Text style={styles.ghostText}>{inviteBusy ? 'Sending…' : 'Send type and percentages'}</Text>
        </Pressable>
      ) : null}
      {inviteNote ? <Text style={styles.note}>{inviteNote}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void loadResultSnapshot().then(async (snapshot) => {
            if (snapshot) await keepQuizSnapshot(snapshot)
            onRooms()
          })
        }}
        style={styles.cta}
      >
        <Text style={styles.ctaText}>Keep on Me</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onSprout(selected.code)} style={styles.ghost}>
        <Text style={styles.ghostText}>Meet this sprout</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onSprouts} style={styles.ghost}>
        <Text style={styles.ghostText}>Sixteen sprouts</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => void restart()} style={styles.ghost}>
        <Text style={styles.ghostText}>Start over</Text>
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
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
  },
  portrait: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  eyebrow: {
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  code: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 42,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  title: {
    color: colors.muted,
    fontSize: 18,
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
    marginBottom: 28,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  heading: {
    marginBottom: 14,
    color: colors.ink,
    fontSize: 18,
  },
  note: {
    marginTop: 12,
    marginBottom: 20,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cta: {
    marginBottom: 12,
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
    marginBottom: 12,
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
