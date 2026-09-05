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
