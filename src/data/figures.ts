import figures from '../content/figures.json'
import { typeByCode } from './personalityTypes'

export type FigureKind = 'figure' | 'fiction' | 'anime'

export type PublicFigure = {
  name: string
  role: string
  code: string
  kind?: FigureKind
}

export const FIGURE_KIND_LABEL: Record<FigureKind, string> = {
  figure: 'Public figures',
  fiction: 'Fiction',
  anime: 'Anime',
}

const KIND_SEARCH: Record<FigureKind, string[]> = {
  figure: ['public', 'figure', 'people'],
  fiction: ['fiction', 'character', 'characters', 'book', 'movie', 'story'],
  anime: ['anime', 'manga'],
}

export function figureKind(figure: PublicFigure): FigureKind {
  return figure.kind ?? 'figure'
}

export const PUBLIC_FIGURES: PublicFigure[] = (figures as PublicFigure[])
  .filter((figure) => Boolean(typeByCode(figure.code)))
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name))

export function matchFigures(query: string) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return PUBLIC_FIGURES
  const kindToken = tokens.find((token) =>
    (Object.keys(KIND_SEARCH) as FigureKind[]).some((kind) => KIND_SEARCH[kind].includes(token)),
  )
  const rest = tokens.filter((token) => token !== kindToken).join(' ')
  const pool = kindToken
    ? PUBLIC_FIGURES.filter((figure) => KIND_SEARCH[figureKind(figure)].includes(kindToken))
    : PUBLIC_FIGURES
  if (!rest) return pool
  return pool.filter((figure) => {
    const type = typeByCode(figure.code)
    return (
      figure.name.toLowerCase().includes(rest) ||
      figure.role.toLowerCase().includes(rest) ||
      figure.code.toLowerCase().includes(rest) ||
      (type?.title.toLowerCase().includes(rest) ?? false)
    )
  })
}

export function groupedFigures(figures: PublicFigure[]) {
  return (['figure', 'fiction', 'anime'] as const)
    .map((kind) => ({
      kind,
      label: FIGURE_KIND_LABEL[kind],
      items: figures.filter((figure) => figureKind(figure) === kind),
    }))
    .filter((group) => group.items.length)
}

export function alreadyInLibrary(
  people: { name: string }[],
  figure: PublicFigure,
) {
  const needle = figure.name.trim().toLowerCase()
  return people.some((person) => person.name.trim().toLowerCase() === needle)
}
