import { parseInviteToken } from './invitePacket'

const KEY = 'jung-functions.invite.v1'

export function rememberInviteToken(raw: string | null | undefined) {
  const token = parseInviteToken(raw)
  if (!token || typeof sessionStorage === 'undefined') return token
  sessionStorage.setItem(KEY, token)
  return token
}

export function loadInviteToken() {
  if (typeof sessionStorage === 'undefined') return null
  return parseInviteToken(sessionStorage.getItem(KEY))
}

export function clearInviteToken() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(KEY)
}

export function captureInviteFromLocation() {
  if (typeof window === 'undefined') return null
  return rememberInviteToken(new URLSearchParams(window.location.search).get('invite'))
}
