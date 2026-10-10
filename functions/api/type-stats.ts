import {
  emptyCensus,
  isTypeCode,
  parseCensus,
  recordResult,
} from '../../src/lib/typeCensusShared.ts'

type CensusEnv = {
  TYPE_CENSUS?: { get: (key: string) => Promise<string | null>; put: (key: string, value: string) => Promise<void> }
  ADMIN_PASSWORD?: string
}

const KEY = 'census:v1'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  try {
    const host = new URL(origin).hostname
    return (
      host === 'jungology.com' ||
      host === 'www.jungology.com' ||
      host.endsWith('.pages.dev') ||
      host === '127.0.0.1' ||
      host === 'localhost'
    )
  } catch {
    return false
  }
}

async function loadStore(env: CensusEnv) {
  if (!env.TYPE_CENSUS) return emptyCensus()
  const raw = await env.TYPE_CENSUS.get(KEY)
  if (!raw) return emptyCensus()
  try {
    return parseCensus(JSON.parse(raw))
  } catch {
    return emptyCensus()
  }
}

export async function onRequestPost(context: { request: Request; env: CensusEnv }) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(403, { error: 'Forbidden' })
  if (!env.TYPE_CENSUS) return json(503, { configured: false, error: 'Type census is not bound yet.' })

  let payload: { suggested?: string; selected?: string }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }
  const suggested = String(payload.suggested ?? '').toUpperCase()
  const selected = String(payload.selected ?? '').toUpperCase()
  if (!isTypeCode(suggested) || !isTypeCode(selected)) {
    return json(400, { error: 'Unknown type' })
  }
  const next = recordResult(await loadStore(env), suggested, selected)
  await env.TYPE_CENSUS.put(KEY, JSON.stringify(next))
  return json(200, { ok: true })
}

export async function onRequestGet(context: { request: Request; env: CensusEnv }) {
  const { request, env } = context
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const password = env.ADMIN_PASSWORD || 'jung'
  if (token !== password) return json(401, { error: 'Wrong password' })
  if (!env.TYPE_CENSUS) return json(503, { configured: false, error: 'Bind a KV namespace named TYPE_CENSUS.' })
  return json(200, { configured: true, ...(await loadStore(env)) })
}
