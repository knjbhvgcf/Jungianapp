export type PortraitSex = 'female' | 'male'

const PORTRAIT_KEY = 'jung-functions.portrait.v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function isPortraitSex(value: unknown): value is PortraitSex {
  return value === 'female' || value === 'male'
}

export function loadPortraitChoice(): PortraitSex | null {
  if (!canUseStorage()) return null
  const raw = sessionStorage.getItem(PORTRAIT_KEY)
  return isPortraitSex(raw) ? raw : null
}

export function savePortraitChoice(choice: PortraitSex) {
  if (!canUseStorage()) return
  sessionStorage.setItem(PORTRAIT_KEY, choice)
}

export function clearPortraitChoice() {
  if (!canUseStorage()) return
  sessionStorage.removeItem(PORTRAIT_KEY)
}

export function portraitSrc(code: string, sex: PortraitSex | null, fallback = '') {
  if (sex === 'female') return `/types/${code.toUpperCase()}-F.png`
  if (sex === 'male') return `/types/${code.toUpperCase()}-M.png`
  return fallback
}
