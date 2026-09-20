export type UnlockProduct = 'map' | 'compat'

export const TYPE_IN_DEPTH_PATH = '/type-in-depth'
export const COMPAT_PATH = '/compatibility'

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
  const raw =
    product === 'compat'
      ? import.meta.env.VITE_COMPAT_CHECKOUT_URL
      : import.meta.env.VITE_DOSSIER_CHECKOUT_URL
  return typeof raw === 'string' ? raw.trim() : ''
}

export function productPagePath(product: UnlockProduct) {
  return product === 'compat' ? COMPAT_PATH : TYPE_IN_DEPTH_PATH
}

/** Stripe Payment Link when set; otherwise the product page so the button still works. */
export function productUnlockHref(product: UnlockProduct) {
  return productCheckoutUrl(product) || productPagePath(product)
}

export function productHref(product: UnlockProduct, unlocked: boolean) {
  return unlocked ? productPagePath(product) : productUnlockHref(product)
}

const REVEAL_STORAGE = 'jung-functions.type-reveal.unlock.v1'

function revealKeys() {
  return envKeys(import.meta.env.VITE_REVEAL_UNLOCK_KEYS || '')
}

/** Stripe Payment Link to see your type after the quiz. Separate from Compatibility. */
export function typeRevealHref() {
  const raw = import.meta.env.VITE_REVEAL_CHECKOUT_URL
  return typeof raw === 'string' ? raw.trim() : ''
}

export function typeRevealPrice() {
  const raw = import.meta.env.VITE_REVEAL_PRICE
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return '$1'
}

export function isTypeRevealUnlocked() {
  if (!canUseStorage()) return false
  return window.localStorage.getItem(REVEAL_STORAGE) === '1'
}

export function tryUnlockTypeReveal(input: string) {
  const normalized = input.trim().toLowerCase()
  if (!normalized || !revealKeys().includes(normalized)) return false
  if (canUseStorage()) window.localStorage.setItem(REVEAL_STORAGE, '1')
  return true
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
