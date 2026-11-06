import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

export type Room = 'me' | 'library' | 'journal' | 'compat'

const ITEMS: { id: Room; label: string }[] = [
  { id: 'me', label: 'Me' },
  { id: 'library', label: 'Library' },
  { id: 'journal', label: 'Journal' },
  { id: 'compat', label: 'Compare' },
]

export function Dock({
  room,
  onRoom,
  libraryPing = false,
}: {
  room: Room
  onRoom: (room: Room) => void
  libraryPing?: boolean
}) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {ITEMS.map((item) => {
        const on = room === item.id
        const ping = item.id === 'library' && libraryPing
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onRoom(item.id)}
            style={[styles.pill, on ? styles.pillOn : null]}
          >
            <Text style={[styles.label, on ? styles.labelOn : null]}>{item.label}</Text>
            {ping ? <View style={[styles.dot, on ? styles.dotOn : null]} /> : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.dim,
    backgroundColor: colors.bg,
  },
  pill: {
    flex: 1,
    position: 'relative',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.ink,
  },
  dotOn: {
    backgroundColor: colors.bg,
  },
  pillOn: {
    backgroundColor: colors.ink,
  },
  label: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  labelOn: {
    color: colors.bg,
  },
})
