import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

export type OptionGroup = {
  label: string
  items: { value: string; label: string; disabled?: boolean }[]
}

export function OptionSheet({
  visible,
  title,
  groups,
  value,
  onPick,
  onClose,
}: {
  visible: boolean
  title: string
  groups: OptionGroup[]
  value: string
  onPick: (value: string) => void
  onClose: () => void
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {groups.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                {group.items.map((item) => {
                  const on = item.value === value
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on, disabled: item.disabled }}
                      disabled={item.disabled}
                      onPress={() => {
                        onPick(item.value)
                        onClose()
                      }}
                      style={[styles.row, on ? styles.rowOn : null, item.disabled ? styles.disabled : null]}
                    >
                      <Text style={[styles.rowText, on ? styles.rowTextOn : null]}>{item.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    maxHeight: '78%',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.bg,
  },
  title: {
    marginBottom: 12,
    color: colors.ink,
    fontSize: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 12,
  },
  group: {
    marginBottom: 12,
  },
  groupLabel: {
    marginBottom: 8,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
  },
  rowOn: {
    backgroundColor: colors.ink,
  },
  rowText: {
    color: colors.ink,
    fontSize: 15,
  },
  rowTextOn: {
    color: colors.bg,
  },
  disabled: {
    opacity: 0.35,
  },
  close: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  closeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
