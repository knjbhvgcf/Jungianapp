export type GuideInlinePart =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }

/** Split `**bold**` and `*italic*` so guide copy can keep the author's emphasis. */
export function parseGuideInline(text: string): GuideInlinePart[] {
  const parts: GuideInlinePart[] = []
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) })
    }
    if (match[1] != null) {
      parts.push({ type: 'strong', value: match[1] })
    } else {
      parts.push({ type: 'em', value: match[2] ?? '' })
    }
    last = match.index + match[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) })
  }
  return parts.length ? parts : [{ type: 'text', value: text }]
}

export const GUIDE_DIAGRAM_KINDS = [
  'names',
  'four',
  'split',
  'stack',
  'stacks',
  'pairs',
  'roles',
  'rules',
] as const

export type GuideDiagramKind = (typeof GUIDE_DIAGRAM_KINDS)[number]

export type GuideDiagramCell = {
  code: string
  note: string
}

export type GuideDiagram = {
  type: 'diagram'
  kind: GuideDiagramKind
  caption: string
  columns: GuideDiagramCell[][]
}

export type GuideBlock = { type: 'paragraph'; text: string } | GuideDiagram

function isDiagramKind(value: string): value is GuideDiagramKind {
  return (GUIDE_DIAGRAM_KINDS as readonly string[]).includes(value)
}

function splitCell(line: string): GuideDiagramCell {
  const trimmed = line.trim()
  const mid =
    trimmed.match(/^(.+?)\s+·\s+(.+)$/) ||
    trimmed.match(/^(.+?)\s+—\s+(.+)$/) ||
    trimmed.match(/^(.+?)\s{2,}(.+)$/)
  if (mid) return { code: mid[1].trim(), note: mid[2].trim() }
  return { code: trimmed, note: '' }
}

/** A paragraph starting with `:::kind` becomes a small type diagram. */
export function parseGuideBlock(text: string): GuideBlock {
  const trimmed = text.replace(/^\uFEFF/, '').trim()
  if (!trimmed.startsWith(':::')) return { type: 'paragraph', text }

  const lines = trimmed.split('\n')
  const header = lines[0].replace(/^:::/, '').trim()
  const [kindRaw, ...captionParts] = header.split(/\s+/)
  if (!kindRaw || !isDiagramKind(kindRaw)) return { type: 'paragraph', text }

  const caption = captionParts.join(' ')
  const body = lines.slice(1).map((line) => line.trimEnd())
  const columns: GuideDiagramCell[][] = [[]]

  for (const line of body) {
    if (line.trim() === '---') {
      columns.push([])
      continue
    }
    if (!line.trim()) continue
    columns[columns.length - 1].push(splitCell(line))
  }

  return {
    type: 'diagram',
    kind: kindRaw,
    caption,
    columns: columns.filter((column) => column.length),
  }
}
