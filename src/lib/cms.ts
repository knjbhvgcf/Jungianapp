import type { CmsFile } from '../content/schema'

const PASSWORD_KEY = 'jung-cms.password'

export type CmsStatus = {
  writable: boolean
  configured: boolean
  usingDefault: boolean
}

export function getCmsPassword() {
  return sessionStorage.getItem(PASSWORD_KEY) ?? ''
}

export function setCmsPassword(password: string) {
  sessionStorage.setItem(PASSWORD_KEY, password)
}

export function clearCmsPassword() {
  sessionStorage.removeItem(PASSWORD_KEY)
}

export async function fetchCmsStatus(): Promise<CmsStatus> {
  try {
    const response = await fetch('/__cms/status')
    if (!response.ok) {
      return { writable: false, configured: false, usingDefault: false }
    }
    return (await response.json()) as CmsStatus
  } catch {
    return { writable: false, configured: false, usingDefault: false }
  }
}

export async function saveCmsFile(file: CmsFile, data: unknown, password: string) {
  const response = await fetch('/__cms/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, data, password }),
  })
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    throw new Error(body.error ?? 'Save failed')
  }
}

export async function uploadCmsImage(code: string, dataUrl: string, password: string) {
  const response = await fetch('/__cms/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, dataUrl, password }),
  })
  const body = (await response.json().catch(() => ({}))) as { error?: string; path?: string }
  if (!response.ok || !body.path) {
    throw new Error(body.error ?? 'Upload failed')
  }
  return body.path
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
