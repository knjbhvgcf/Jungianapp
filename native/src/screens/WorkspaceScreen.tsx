import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { pickPerson } from '../../../src/lib/workspace/compatPick'
import { offeringFirstWeek } from '../../../src/lib/workspace/firstWeek'
import {
  INVITE_WATCH_MS,
  armPendingInvitePings,
  latestUnseenPing,
  pendingInvitePeople,
  pingThisDevice,
  pullInviteArrivals,
  unseenPings,
} from '../../../src/lib/workspace/inviteWatch'
import { appleBillingRequired, roomsUnlocked, useStoreEntitlement } from '../billing'
import { Dock, type Room } from '../components/Dock'
import {
  dismissPing,
  finishFirstWeek,
  keepInviteArrival,
  keepQuizSnapshot,
  loadHouse,
  pullQuizPercents,
  skipFirstWeek,
  useHouse,
} from '../house'
import { loadResultSnapshot } from '../snapshot'
import { colors } from '../theme'
import { ui } from '../ui'
import { CompareRoom } from './workspace/CompareRoom'
import { FirstWeekRoom } from './workspace/FirstWeekRoom'
import { JournalRoom } from './workspace/JournalRoom'
import { LibraryRoom } from './workspace/LibraryRoom'
import { MeRoom } from './workspace/MeRoom'
import { PaywallRoom } from './workspace/PaywallRoom'

export function WorkspaceScreen({
  onQuiz,
  onSprouts,
  onSprout,
}: {
  onQuiz: () => void
  onSprouts: () => void
  onSprout: (code: string) => void
}) {
  const house = useHouse()
  const { entitlement, refresh } = useStoreEntitlement()
  const [room, setRoom] = useState<Room>('me')
  const [compatRight, setCompatRight] = useState('')

  useEffect(() => {
    void (async () => {
      const next = await loadHouse()
      const snapshot = await loadResultSnapshot()
      if (!snapshot) return
      if (next.self) await pullQuizPercents(snapshot)
      else await keepQuizSnapshot(snapshot)
    })()
  }, [])

  const pendingKey = house
    ? pendingInvitePeople(house)
        .map((person) => `${person.id}:${person.inviteToken ?? ''}`)
        .join(',')
    : ''

  useEffect(() => {
    if (!house) return
    armPendingInvitePings(house)
    if (!pendingKey) return
    let cancelled = false
    async function tick() {
      const latest = await loadHouse()
      const arrivals = await pullInviteArrivals(pendingInvitePeople(latest))
      if (cancelled || !arrivals.length) return
      for (const item of arrivals) {
        await keepInviteArrival(item.person.id, item.snapshot)
        pingThisDevice(item.person.name, item.snapshot.code)
      }
    }
    void tick()
    const timer = setInterval(() => void tick(), INVITE_WATCH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [house, pendingKey])

  if (!house || (appleBillingRequired() && !entitlement)) {
    return (
      <View style={styles.center}>
        <Text style={ui.note}>{house ? 'Checking the App Store…' : 'Opening the rooms…'}</Text>
      </View>
    )
  }

  function goRoom(next: Room) {
    setRoom(next)
  }

  if (!roomsUnlocked(entitlement)) {
    return (
      <View style={styles.shell}>
        <PaywallRoom
          entitlement={entitlement ?? { available: false, active: false }}
          onUnlocked={() => {
            void refresh()
          }}
          onQuiz={onQuiz}
        />
      </View>
    )
  }

  if (offeringFirstWeek(house)) {
    return (
      <View style={styles.shell}>
        <FirstWeekRoom
          house={house}
          onSkip={() => {
            void skipFirstWeek()
          }}
          onCompare={(id) => {
            void finishFirstWeek().then(() => {
              setCompatRight(pickPerson(id))
              setRoom('compat')
            })
          }}
        />
      </View>
    )
  }

  const ping = latestUnseenPing(house)

  return (
    <View style={styles.shell}>
      {ping ? (
        <View style={styles.ping}>
          <Text style={styles.pingText}>
            {ping.name} sent {ping.code}.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void dismissPing(ping.id).then(() => {
                setCompatRight(pickPerson(ping.personId))
                setRoom('compat')
              })
            }}
            style={ui.cta}
          >
            <Text style={ui.ctaText}>Compare</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void dismissPing(ping.id)
            }}
            style={[ui.ghost, styles.pingDismiss]}
          >
            <Text style={ui.ghostText}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.body}>
        {room === 'me' ? (
          <MeRoom
            self={house.self}
            plan={house.plan}
            onQuiz={onQuiz}
            onSprouts={onSprouts}
            onSprout={onSprout}
            onBillingChange={() => {
              void refresh()
            }}
          />
        ) : null}
        {room === 'library' ? (
          <LibraryRoom
            house={house}
            onCompare={(id) => {
              setCompatRight(pickPerson(id))
              setRoom('compat')
            }}
            onMe={() => setRoom('me')}
          />
        ) : null}
        {room === 'journal' ? <JournalRoom house={house} /> : null}
        {room === 'compat' ? (
          <CompareRoom house={house} rightValue={compatRight} onRightValue={setCompatRight} />
        ) : null}
      </View>
      <Dock room={room} onRoom={goRoom} libraryPing={unseenPings(house).length > 0} />
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ping: {
    marginHorizontal: 22,
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    gap: 10,
  },
  pingText: {
    color: colors.ink,
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  pingDismiss: {
    marginTop: 0,
  },
})
