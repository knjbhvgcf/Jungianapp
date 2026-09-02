export type UnlockProduct = 'map' | 'compat'

export const TYPE_IN_DEPTH_PATH = '/type-in-depth'

const STORAGE: Record<UnlockProduct, string> = {
  map: 'jung-functions.dossier.unlock.v1',
  compat: 'jung-functions.compat.unlock.v1',
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function envKeys(raw: string) {
  return raw
    .split(',')
    .map((key: string) => key.trim().toLowerCase())
    .filter(Boolean)
}

export function productPrice(product: UnlockProduct) {
  if (product === 'compat') return import.meta.env.VITE_COMPAT_PRICE || '$1'
  return import.meta.env.VITE_DOSSIER_PRICE || '$3'
}

export function productCheckoutUrl(product: UnlockProduct) {
  if (product === 'compat') return import.meta.env.VITE_COMPAT_CHECKOUT_URL || ''
  return import.meta.env.VITE_DOSSIER_CHECKOUT_URL || ''
}

function configuredKeys(product: UnlockProduct) {
  const raw =
    product === 'compat'
      ? import.meta.env.VITE_COMPAT_UNLOCK_KEYS || ''
      : import.meta.env.VITE_DOSSIER_UNLOCK_KEYS || ''
  return envKeys(raw)
}

export function isProductUnlocked(product: UnlockProduct) {
  if (!canUseStorage()) return false
  return window.localStorage.getItem(STORAGE[product]) === '1'
}

export function setProductUnlocked(product: UnlockProduct, unlocked: boolean) {
  if (!canUseStorage()) return
  if (unlocked) window.localStorage.setItem(STORAGE[product], '1')
  else window.localStorage.removeItem(STORAGE[product])
}

export function tryUnlockKey(input: string, product: UnlockProduct) {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return false
  if (configuredKeys(product).includes(normalized)) {
    setProductUnlocked(product, true)
    return true
  }
  return false
}
