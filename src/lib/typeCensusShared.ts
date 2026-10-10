export const TYPE_CODES = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const

export type TypeCode = (typeof TYPE_CODES)[number]

export type CensusSnapshot = {
  version: 1
  total: number
  suggested: Record<string, number>
  selected: Record<string, number>
  updatedAt: string
}

export function isTypeCode(value: string): value is TypeCode {
  return (TYPE_CODES as readonly string[]).includes(value)
}

export function emptyCensus(): CensusSnapshot {
  const zeros = Object.fromEntries(TYPE_CODES.map((code) => [code, 0])) as Record<string, number>
  return {
    version: 1,
    total: 0,
    suggested: { ...zeros },
    selected: { ...zeros },
    updatedAt: new Date().toISOString(),
  }
}

export function parseCensus(value: unknown): CensusSnapshot {
  const fallback = emptyCensus()
  if (!value || typeof value !== 'object') return fallback
  const raw = value as Partial<CensusSnapshot>
  const suggested = { ...fallback.suggested }
  const selected = { ...fallback.selected }
  if (raw.suggested && typeof raw.suggested === 'object') {
    for (const code of TYPE_CODES) {
      const n = Number(raw.suggested[code])
      if (Number.isFinite(n) && n > 0) suggested[code] = Math.floor(n)
    }
  }
  if (raw.selected && typeof raw.selected === 'object') {
    for (const code of TYPE_CODES) {
      const n = Number(raw.selected[code])
      if (Number.isFinite(n) && n > 0) selected[code] = Math.floor(n)
    }
  }
  const total = TYPE_CODES.reduce((sum, code) => sum + (suggested[code] ?? 0), 0)
  return {
    version: 1,
    total,
    suggested,
    selected,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
}

export function recordResult(
  store: CensusSnapshot,
  suggested: TypeCode,
  selected: TypeCode,
): CensusSnapshot {
  const next = parseCensus(store)
  next.suggested[suggested] = (next.suggested[suggested] ?? 0) + 1
  next.selected[selected] = (next.selected[selected] ?? 0) + 1
  next.total += 1
  next.updatedAt = new Date().toISOString()
  return next
}
