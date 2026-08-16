import pages from '../content/pages.json'
import type { PagesContent } from '../content/schema'

export const siteCopy = pages as PagesContent

export function fillCopy(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : `{${key}}`,
  )
}
