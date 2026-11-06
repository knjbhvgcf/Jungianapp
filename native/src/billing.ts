import { useCallback, useEffect, useState } from 'react'
import { Linking, Platform } from 'react-native'
import {
  ErrorCode,
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  getAvailablePurchases,
  getUserFriendlyErrorMessage,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap'
import { applyStorePlan } from './house'

export const MONTHLY_SKU = 'com.jungology.app.monthly'
export const FALLBACK_PRICE = '$10'
const MANAGE_HREF = 'https://apps.apple.com/account/subscriptions'

export type StoreEntitlement = {
  available: boolean
  active: boolean
  originalTransactionId?: string
  localizedPrice?: string
}

const UNLOCKED: StoreEntitlement = { available: true, active: true }

let connecting: Promise<boolean> | null = null

export function appleBillingRequired() {
  return Platform.OS === 'ios'
}

export function roomsUnlocked(entitlement: StoreEntitlement | null) {
  if (!appleBillingRequired()) return true
  return entitlement?.active === true
}

async function ensureConnection() {
  if (!appleBillingRequired()) return false
  if (!connecting) {
    connecting = initConnection()
      .then(() => true)
      .catch((error) => {
        connecting = null
        throw error
      })
  }
  return connecting
}

function originalTransactionId(purchase: Purchase) {
  if ('originalTransactionIdentifierIOS' in purchase) {
    const id = purchase.originalTransactionIdentifierIOS
    if (typeof id === 'string' && id) return id
  }
  return purchase.transactionId || undefined
}

async function finishMonthly(purchase: Purchase) {
  if (purchase.productId !== MONTHLY_SKU) return
  try {
    await finishTransaction({ purchase, isConsumable: false })
  } catch {
    /* already finished, or Expo Go */
  }
}

async function monthlyPrice() {
  try {
    const products = await fetchProducts({ skus: [MONTHLY_SKU], type: 'subs' })
    const product = Array.isArray(products) ? products[0] : undefined
    if (product && typeof product.displayPrice === 'string' && product.displayPrice) {
      return product.displayPrice
    }
  } catch {
    /* product not in App Store Connect yet */
  }
  return undefined
}

export async function syncStoreEntitlement(): Promise<StoreEntitlement> {
  if (!appleBillingRequired()) return UNLOCKED
  try {
    await ensureConnection()
  } catch {
    return { available: false, active: false }
  }

  const localizedPrice = await monthlyPrice()

  try {
    const held = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })
    for (const purchase of held) await finishMonthly(purchase)

    const subs = await getActiveSubscriptions([MONTHLY_SKU])
    const current = subs.find((item) => item.isActive)
    if (current) {
      return {
        available: true,
        active: true,
        originalTransactionId: current.transactionId,
        localizedPrice,
      }
    }
    return { available: true, active: false, localizedPrice }
  } catch {
    return { available: false, active: false, localizedPrice }
  }
}

function waitForPurchase() {
  let succeed: { remove: () => void } | undefined
  let fail: { remove: () => void } | undefined
  const promise = new Promise<Purchase>((resolve, reject) => {
    let settled = false
    succeed = purchaseUpdatedListener((purchase) => {
      if (settled) return
      settled = true
      succeed?.remove()
      fail?.remove()
      resolve(purchase)
    })
    fail = purchaseErrorListener((error) => {
      if (settled) return
      settled = true
      succeed?.remove()
      fail?.remove()
      reject(error)
    })
  })
  return {
    promise,
    cancel() {
      succeed?.remove()
      fail?.remove()
    },
  }
}

export async function subscribeMonthly(): Promise<StoreEntitlement> {
  await ensureConnection()
  const pending = waitForPurchase()
  try {
    await requestPurchase({
      request: { apple: { sku: MONTHLY_SKU } },
      type: 'subs',
    })
    const purchase = await pending.promise
    await finishMonthly(purchase)
    const next = await syncStoreEntitlement()
    if (!next.active) {
      return {
        available: true,
        active: true,
        originalTransactionId: originalTransactionId(purchase),
        localizedPrice: next.localizedPrice,
      }
    }
    return next
  } catch (error) {
    pending.cancel()
    throw error
  }
}

export async function restoreMonthly(): Promise<StoreEntitlement> {
  await ensureConnection()
  await restorePurchases()
  return syncStoreEntitlement()
}

export async function openSubscriptionManagement() {
  try {
    await deepLinkToSubscriptions({})
  } catch {
    await Linking.openURL(MANAGE_HREF)
  }
}

export function purchaseMessage(error: unknown) {
  if (isUserCancelledError(error)) return ''
  const code =
    error && typeof error === 'object' && 'code' in error ? String((error as { code?: string }).code) : ''
  if (code === ErrorCode.IapNotAvailable || code === ErrorCode.BillingUnavailable) {
    return 'Open this build from TestFlight or the App Store to subscribe.'
  }
  if (code === ErrorCode.SkuNotFound || code === ErrorCode.ItemUnavailable) {
    return 'The App Store does not have this subscription yet.'
  }
  const friendly = getUserFriendlyErrorMessage(
    error && typeof error === 'object' ? (error as { code?: string; message?: string }) : '',
  )
  return friendly || 'The App Store could not finish that.'
}

export function priceLabel(entitlement: StoreEntitlement | null) {
  return entitlement?.localizedPrice || FALLBACK_PRICE
}

export function useStoreEntitlement() {
  const required = appleBillingRequired()
  const [entitlement, setEntitlement] = useState<StoreEntitlement | null>(required ? null : UNLOCKED)

  const refresh = useCallback(async () => {
    const next = await syncStoreEntitlement()
    if (appleBillingRequired()) await applyStorePlan(next)
    setEntitlement(next)
    return next
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { entitlement, refresh }
}
