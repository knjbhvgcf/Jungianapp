import { StyleSheet, Text, View } from 'react-native'
import { FUNCTIONS } from '../../../src/data/functions'
import type { FunctionScore } from '../../../src/lib/scoring'
import { colors } from '../theme'

export function ScoreRow({ score }: { score: FunctionScore }) {
  const fn = FUNCTIONS[score.id]
  const width = Math.max(score.percent, 3)

  return (
    <View style={styles.wrap}>
      <View style={styles.label}>
        <Text style={styles.id}>{fn.id}</Text>
        <Text style={styles.name}>{fn.name}</Text>
        <Text style={styles.pct}>{score.percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${width}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    marginBottom: 14,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  id: {
    width: 28,
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  name: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
  },
  pct: {
    color: colors.ink,
    fontFamily: 'Courier',
    fontSize: 13,
  },
  track: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#2a2a2a',
  },
  fill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.fill,
  },
})
