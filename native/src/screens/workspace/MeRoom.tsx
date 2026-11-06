import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import {
  appleBillingRequired,
  openSubscriptionManagement,
  purchaseMessage,
  restoreMonthly,
} from '../../billing'
import { FUNCTION_IDS, type FunctionId } from '../../../../src/data/functions'
import { PERSONALITY_TYPES, typeByCode } from '../../../../src/data/personalityTypes'
import { preferredParent } from '../../../../src/lib/scoring'
import { snapshotFromType } from '../../../../src/lib/workspace/fromType'
import { encodeShareLine, hasPercents } from '../../../../src/lib/workspace/sharePacket'
import type { ResultSnapshot, WorkspacePlan } from '../../../../src/lib/workspace/types'
import { EightSeats } from '../../components/EightSeats'
import { OptionSheet } from '../../components/OptionSheet'
import { ScoreRow } from '../../components/ScoreRow'
import { SproutPortrait } from '../../components/SproutPortrait'
import { StackPicker } from '../../components/StackPicker'
import { applyStorePlan, nameType, pullQuizPercents, saveSelfSnapshot } from '../../house'
import { loadResultSnapshot } from '../../snapshot'
import { colors } from '../../theme'
import { ui } from '../../ui'

function typeFromSpine(hero: FunctionId, parent: FunctionId) {
  return PERSONALITY_TYPES.find((type) => type.stack[0] === hero && type.stack[1] === parent)
}

function scoresFrom(self: ResultSnapshot | null) {
  return FUNCTION_IDS.map((id) => ({
    id,
    raw: 0,
    percent: self?.percents?.[id] ?? 0,
  })).sort((a, b) => b.percent - a.percent)
}

async function copyText(line: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(line)
      return true
    }
  } catch {
    /* fall through to share sheet */
  }
  try {
    await Share.share({ message: line })
    return true
  } catch {
    return false
  }
}

export function MeRoom({
  self,
  plan,
  onQuiz,
  onSprouts,
  onSprout,
  onBillingChange,
}: {
  self: ResultSnapshot | null
  plan?: WorkspacePlan
  onQuiz: () => void
  onSprouts: () => void
  onSprout: (code: string) => void
  onBillingChange?: () => void
}) {
  const [seat, setSeat] = useState<number | null>(null)
  const [fold, setFold] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [pickingType, setPickingType] = useState(false)
  const [copied, setCopied] = useState(false)
  const [billingBusy, setBillingBusy] = useState<'restore' | 'manage' | null>(null)
  const [billingNote, setBillingNote] = useState('')
  const previewType = self ? typeByCode(self.code) : undefined
  const scores = useMemo(() => scoresFrom(self), [self])
  const hero = self?.stack[0] ?? scores[0]?.id ?? 'Ni'
  const parent = self?.stack[1] ?? preferredParent(hero, scores)
  const foldPreview = typeFromSpine(hero, parent) ?? previewType
  const line = self && hasPercents(self.percents) ? encodeShareLine(self) : null

  useEffect(() => {
    void loadResultSnapshot().then((snapshot) => {
      void pullQuizPercents(snapshot)
    })
  }, [])

  async function applySpine(nextHero: FunctionId, nextParent: FunctionId) {
    const type = typeFromSpine(nextHero, nextParent)
    if (!type) return
    const next = snapshotFromType(type.code, self)
    if (!next) return
    await saveSelfSnapshot(next)
    setSeat(null)
  }

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      {self ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${self.code} ${self.title}`}
            onPress={() => onSprout(self.code)}
            style={styles.portrait}
          >
            <SproutPortrait code={self.code} size={160} />
          </Pressable>
          <Text style={ui.code}>{self.code}</Text>
          <Text style={ui.stat}>
            {previewType?.title ?? self.title}
            {self.stack[0] ? ` · ${self.stack[0]} → ${self.stack[1]}` : ''}
          </Text>
          {hasPercents(self.percents) ? (
            <Text style={ui.lede}>The letters are the type you chose. The numbers are the last quiz.</Text>
          ) : (
            <Text style={ui.note}>No quiz percentages yet.</Text>
          )}
          <EightSeats
            stack={self.stack}
            percents={self.percents}
            selected={seat}
            onSelect={(index) => setSeat((current) => (current === index ? null : index))}
            caption="My eight seats. Tap a seat."
          />
        </>
      ) : (
        <>
          <Text style={ui.eyebrow}>Me</Text>
          <Text style={ui.title}>Name a type</Text>
          <Text style={ui.lede}>Keep a type here, or take the quiz. Scores stay on this phone.</Text>
        </>
      )}

      <Pressable accessibilityRole="button" onPress={onQuiz} style={[ui.cta, styles.gap]}>
        <Text style={ui.ctaText}>{self ? 'Retake the quiz' : 'Begin the quiz'}</Text>
      </Pressable>

      {self ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: fold }}
          onPress={() => setFold((open) => !open)}
          style={[ui.ghost, styles.gap]}
        >
          <Text style={ui.ghostText}>{fold ? 'Close' : 'Not quite this type?'}</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickingType(true)}
          style={[ui.ghost, styles.gap]}
        >
          <Text style={ui.ghostText}>Pick a type</Text>
        </Pressable>
      )}

      {self && fold ? (
        <View style={styles.fold}>
          {hasPercents(self.percents)
            ? scores.map((score) => <ScoreRow key={score.id} score={score} />)
            : null}
          <StackPicker
            scores={scores}
            hero={hero}
            parent={parent}
            preview={
              foldPreview
                ? { code: foldPreview.code, title: foldPreview.title, summary: foldPreview.summary }
                : undefined
            }
            onHeroChange={(next) => void applySpine(next, preferredParent(next, scores))}
            onParentChange={(next) => void applySpine(hero, next)}
            onOpenPreview={onSprout}
          />
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={onSprouts} style={[ui.ghost, styles.gap]}>
        <Text style={ui.ghostText}>Sixteen sprouts</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: copyOpen }}
        onPress={() => setCopyOpen((open) => !open)}
        style={[ui.ghost, styles.gap]}
      >
        <Text style={ui.ghostText}>{copyOpen ? 'Close' : 'Copy for a friend'}</Text>
      </Pressable>

      {copyOpen ? (
        <View style={styles.fold}>
          <Text style={ui.lede}>
            This is your type and eight percentages. Not the answers. They paste the line in Library.
          </Text>
          {line ? (
            <>
              <View style={styles.lineBox}>
                <Text selectable style={styles.line}>
                  {line}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void copyText(line).then((ok) => {
                    if (!ok) return
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
                style={ui.cta}
              >
                <Text style={ui.ctaText}>{copied ? 'Copied' : 'Copy the line'}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={ui.note}>
              {self
                ? 'No quiz percentages yet. Take the quiz so there is a line to copy.'
                : 'Name a type, or take the quiz, so there is a line to copy.'}
            </Text>
          )}
        </View>
      ) : null}

      {appleBillingRequired() ? (
        <View style={styles.fold}>
          <Text style={ui.stat}>
            {plan === 'active' ? 'Jungology App on the App Store' : 'No App Store subscription on this phone'}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={billingBusy != null}
            onPress={() => {
              setBillingNote('')
              setBillingBusy('restore')
              void restoreMonthly()
                .then(async (next) => {
                  await applyStorePlan(next)
                  onBillingChange?.()
                  setBillingNote(
                    next.active ? 'Restored.' : 'No subscription to restore on this Apple ID.',
                  )
                })
                .catch((error) => {
                  const message = purchaseMessage(error)
                  if (message) setBillingNote(message)
                })
                .finally(() => setBillingBusy(null))
            }}
            style={[ui.ghost, styles.gap]}
          >
            <Text style={ui.ghostText}>{billingBusy === 'restore' ? 'Restoring' : 'Restore purchases'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={billingBusy != null}
            onPress={() => {
              setBillingNote('')
              setBillingBusy('manage')
              void openSubscriptionManagement()
                .catch(() => setBillingNote('Could not open Apple ID subscriptions.'))
                .finally(() => setBillingBusy(null))
            }}
            style={[ui.ghost, styles.gap]}
          >
            <Text style={ui.ghostText}>
              {billingBusy === 'manage' ? 'Opening' : 'Manage on the App Store'}
            </Text>
          </Pressable>
          {billingNote ? <Text style={ui.note}>{billingNote}</Text> : null}
        </View>
      ) : null}

      <OptionSheet
        visible={pickingType}
        title="Sixteen types"
        value={self?.code ?? ''}
        groups={[
          {
            label: 'Types',
            items: PERSONALITY_TYPES.map((type) => ({
              value: type.code,
              label: `${type.code} · ${type.title}`,
            })),
          },
        ]}
        onPick={(code) => void nameType(code)}
        onClose={() => setPickingType(false)}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  portrait: {
    alignItems: 'center',
    marginBottom: 4,
  },
  gap: {
    marginBottom: 12,
  },
  fold: {
    marginBottom: 16,
  },
  lineBox: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  line: {
    color: colors.ink,
    fontFamily: 'Courier',
    fontSize: 14,
    lineHeight: 22,
  },
})
