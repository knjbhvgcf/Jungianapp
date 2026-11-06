import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LIKERT_LABELS } from '../../../src/data/questions'
import { colors } from '../theme'

type LikertProps = {
  value?: number
  onChange: (value: number) => void
}

export function Likert({ value, onChange }: LikertProps) {
  return (
    <View>
      <Text style={styles.hint}>1 strongly disagree · 5 strongly agree</Text>
      <View style={styles.row}>
        {LIKERT_LABELS.map((option) => {
          const selected = value === option.value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`${option.value}, ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.dot, selected ? styles.dotOn : null]}
            >
              <Text style={[styles.num, selected ? styles.numOn : null]}>{option.value}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hint: {
    marginBottom: 16,
    color: colors.faint,
    fontFamily: 'Courier',
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dot: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  dotOn: {
    backgroundColor: colors.ink,
  },
  num: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
  },
  numOn: {
    color: colors.bg,
  },
})
