import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  appleBillingRequired,
  priceLabel,
  purchaseMessage,
  restoreMonthly,
  subscribeMonthly,
  type StoreEntitlement,
} from '../../billing'
import { applyStorePlan } from '../../house'
import { ui } from '../../ui'

export function PaywallRoom({
  entitlement,
  onUnlocked,
  onQuiz,
}: {
  entitlement: StoreEntitlement
  onUnlocked: (next: StoreEntitlement) => void
  onQuiz: () => void
}) {
  const [busy, setBusy] = useState<'subscribe' | 'restore' | null>(null)
  const [note, setNote] = useState('')
  const price = priceLabel(entitlement)
  const storeReady = entitlement.available

  async function keep(next: StoreEntitlement, emptyRestore = false) {
    await applyStorePlan(next)
    if (next.active) {
      onUnlocked(next)
      return
    }
    setNote(
      emptyRestore
        ? 'No subscription to restore on this Apple ID.'
        : next.available
          ? ''
          : 'Open this build from TestFlight or the App Store to subscribe.',
    )
  }

  async function subscribe() {
    setNote('')
    setBusy('subscribe')
    try {
      await keep(await subscribeMonthly())
    } catch (error) {
      const message = purchaseMessage(error)
      if (message) setNote(message)
    } finally {
      setBusy(null)
    }
  }

  async function restore() {
    setNote('')
    setBusy('restore')
    try {
      await keep(await restoreMonthly(), true)
    } catch (error) {
      const message = purchaseMessage(error)
      if (message) setNote(message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      <Text style={ui.eyebrow}>7 days free, then {price} / month</Text>
      <Text style={ui.title}>Jungology App</Text>
      <Text style={ui.lede}>
        People in your life, and whether this hour is ordinary, a loop, or grip.
      </Text>
      {storeReady ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy != null}
          onPress={() => void subscribe()}
          style={[ui.cta, styles.gap]}
        >
          <Text style={ui.ctaText}>{busy === 'subscribe' ? 'Opening the App Store' : 'Start 7 days free'}</Text>
        </Pressable>
      ) : (
        <View style={[ui.cta, styles.gap, styles.disabled]}>
          <Text style={ui.ctaText}>Start 7 days free</Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy != null}
        onPress={() => void restore()}
        style={[ui.ghost, styles.gap]}
      >
        <Text style={ui.ghostText}>{busy === 'restore' ? 'Restoring' : 'Restore purchases'}</Text>
      </Pressable>
      {note ? <Text style={ui.note}>{note}</Text> : null}
      {!storeReady ? (
        <Text style={ui.note}>Open this build from TestFlight or the App Store to subscribe.</Text>
      ) : null}
      {appleBillingRequired() ? (
        <Text style={ui.note}>Cancel anytime in your Apple ID subscriptions.</Text>
      ) : null}
      <Pressable accessibilityRole="button" onPress={onQuiz} style={[ui.ghost, styles.gap]}>
        <Text style={ui.ghostText}>The quiz stays free</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  gap: {
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.45,
  },
})
