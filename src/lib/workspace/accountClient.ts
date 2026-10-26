import type { WorkspaceHouse } from './types'

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error || fallback
  } catch {
    return fallback
  }
}

export async function requestWorkspaceLink(email: string) {
  const response = await fetch('/api/workspace-link', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) throw new Error(await readError(response, 'Could not make the sign-in link.'))
  return (await response.json()) as { sent: true; devLink?: string }
}

export async function fetchWorkspaceHouse() {
  const response = await fetch('/api/workspace-house', { credentials: 'include' })
  if (response.status === 401) return { status: 401 as const, house: null }
  if (!response.ok) throw new Error(await readError(response, 'Could not load the account.'))
  return { status: 200 as const, house: (await response.json()) as WorkspaceHouse }
}

export async function putWorkspaceHouse(house: WorkspaceHouse) {
  const response = await fetch('/api/workspace-house', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(house),
  })
  if (!response.ok) throw new Error(await readError(response, 'Could not save the account.'))
  return (await response.json()) as WorkspaceHouse
}

export async function logoutWorkspace() {
  await fetch('/api/workspace-logout', { method: 'POST', credentials: 'include' })
}

export async function confirmWorkspacePaid(sessionId: string) {
  const response = await fetch('/api/workspace-paid', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionId ? { sessionId } : {}),
  })
  if (!response.ok) throw new Error(await readError(response, 'Could not confirm payment.'))
  return (await response.json()) as WorkspaceHouse
}
