import AsyncStorage from '@react-native-async-storage/async-storage'
import { inviteQuizHref, parseInviteToken } from '../../src/lib/workspace/invitePacket'

const KEY = 'jung-functions.invite.v1'

function inviteOrigin() {
  if (typeof window !== 'undefined') {
    const { hostname, port, origin } = window.location
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      if (port === '8081' || port === '19006' || port === '8082') return 'http://127.0.0.1:5173'
      return origin
    }
  }
  return 'https://jungology.com'
}

export function shareInviteHref(token: string) {
  return inviteQuizHref(inviteOrigin(), token)
}

export async function rememberInviteToken(raw: string | null | undefined) {
  const token = parseInviteToken(raw)
  if (!token) return token
  try {
    await AsyncStorage.setItem(KEY, token)
  } catch {
    /* private mode / full disk */
  }
  return token
}

export async function loadInviteToken() {
  try {
    return parseInviteToken(await AsyncStorage.getItem(KEY))
  } catch {
    return null
  }
}

export async function clearInviteToken() {
  try {
    await AsyncStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export async function captureInviteFromLocation() {
  if (typeof window === 'undefined') return null
  return rememberInviteToken(new URLSearchParams(window.location.search).get('invite'))
}
