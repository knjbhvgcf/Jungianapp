import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  confirmPaidForRequest,
  handleWorkspaceStripeWebhook,
  houseForRequest,
  logoutCookie,
  normalizeEmail,
  requestMagicLink,
  saveHouseForRequest,
  signedInEmail,
  verifyMagicLink,
  type AccountEnv,
  type KvStore,
} from './src/lib/workspace/accountServer.ts'
import { readWorkspaceCheckoutSession } from './src/lib/workspace/stripeServer.ts'

const STORE = path.resolve(process.cwd(), '.data/workspace-kv.json')

type DiskRecord = { value: string; exp?: number }
type DiskKv = Record<string, DiskRecord>

function readDisk(): DiskKv {
  try {
    return JSON.parse(fs.readFileSync(STORE, 'utf8')) as DiskKv
  } catch {
    return {}
  }
}

function writeDisk(data: DiskKv) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true })
  fs.writeFileSync(STORE, `${JSON.stringify(data, null, 2)}\n`)
}

function fileKv(): KvStore {
  return {
    async get(key) {
      const data = readDisk()
      const row = data[key]
      if (!row) return null
      if (row.exp && row.exp * 1000 < Date.now()) {
        delete data[key]
        writeDisk(data)
        return null
      }
      return row.value
    },
    async put(key, value, options) {
      const data = readDisk()
      const exp = options?.expirationTtl
        ? Math.floor(Date.now() / 1000) + options.expirationTtl
        : undefined
      data[key] = exp ? { value, exp } : { value }
      writeDisk(data)
    },
    async delete(key) {
      const data = readDisk()
      delete data[key]
      writeDisk(data)
    },
  }
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown, setCookie?: string) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  if (setCookie) res.setHeader('Set-Cookie', setCookie)
  res.end(JSON.stringify(body))
}

function originOf(req: IncomingMessage) {
  const host = req.headers.host || '127.0.0.1:5173'
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0]
  return `${proto}://${host}`
}

function pathOf(req: IncomingMessage) {
  return req.url?.split('?')[0] ?? ''
}

function cookieHeader(req: IncomingMessage) {
  const value = req.headers.cookie
  return Array.isArray(value) ? value.join('; ') : (value ?? null)
}

export function workspaceAccountPlugin(base: Omit<AccountEnv, 'WORKSPACE_HOUSES'>): Plugin {
  const env: AccountEnv = { ...base, WORKSPACE_HOUSES: fileKv() }

  return {
    name: 'jung-workspace-account',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathName = pathOf(req)
        if (
          pathName !== '/api/workspace-link' &&
          pathName !== '/api/workspace-verify' &&
          pathName !== '/api/workspace-logout' &&
          pathName !== '/api/workspace-house' &&
          pathName !== '/api/workspace-paid' &&
          pathName !== '/api/workspace-session' &&
          pathName !== '/api/workspace-stripe'
        ) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const origin = originOf(req)

        try {
          if (pathName === '/api/workspace-link' && req.method === 'POST') {
            let payload: { email?: string }
            try {
              payload = JSON.parse(await readBody(req)) as typeof payload
            } catch {
              sendJson(res, 400, { error: 'Invalid JSON' })
              return
            }
            const forwarded = req.headers['x-forwarded-for']
            const ip =
              (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
              req.socket.remoteAddress ||
              ''
            const result = await requestMagicLink(env, {
              email: String(payload.email ?? ''),
              origin,
              ip,
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, { sent: true, devLink: result.devLink })
            return
          }

          if (pathName === '/api/workspace-verify' && req.method === 'GET') {
            const token = new URL(req.url ?? '', origin).searchParams.get('token') ?? ''
            const result = await verifyMagicLink(env, { token, origin })
            if (!result.ok) {
              res.statusCode = 302
              res.setHeader('Location', `${origin}/workspace/join?link=expired`)
              res.end()
              return
            }
            res.statusCode = 302
            res.setHeader('Location', result.location)
            res.setHeader('Set-Cookie', result.setCookie)
            res.end()
            return
          }

          if (pathName === '/api/workspace-logout' && req.method === 'POST') {
            const result = await logoutCookie(origin)
            sendJson(res, 200, { ok: true }, result.setCookie)
            return
          }

          if (pathName === '/api/workspace-house' && req.method === 'GET') {
            const result = await houseForRequest(env, {
              cookieHeader: cookieHeader(req),
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, result.house)
            return
          }

          if (pathName === '/api/workspace-house' && req.method === 'PUT') {
            let body: unknown
            try {
              body = JSON.parse(await readBody(req))
            } catch {
              sendJson(res, 400, { error: 'Invalid JSON' })
              return
            }
            const result = await saveHouseForRequest(env, {
              cookieHeader: cookieHeader(req),
              body,
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, result.house)
            return
          }

          if (pathName === '/api/workspace-paid' && req.method === 'POST') {
            let payload: { sessionId?: string }
            try {
              payload = JSON.parse(await readBody(req)) as typeof payload
            } catch {
              sendJson(res, 400, { error: 'Invalid JSON' })
              return
            }
            const result = await confirmPaidForRequest(env, {
              cookieHeader: cookieHeader(req),
              sessionId: String(payload.sessionId ?? ''),
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, result.house)
            return
          }

          if (pathName === '/api/workspace-session' && req.method === 'GET') {
            const who = await signedInEmail(env, cookieHeader(req))
            if (!who.ok) {
              sendJson(res, who.status, { error: who.error })
              return
            }
            const sessionId = new URL(req.url ?? '', origin).searchParams.get('session_id') ?? ''
            const result = await readWorkspaceCheckoutSession(env, sessionId)
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            if (result.info.email && normalizeEmail(result.info.email) !== who.email) {
              sendJson(res, 403, { error: 'That checkout belongs to a different email.' })
              return
            }
            sendJson(res, 200, result.info)
            return
          }

          if (pathName === '/api/workspace-stripe' && req.method === 'POST') {
            const rawBody = await readBody(req)
            const signatureHeader = req.headers['stripe-signature']
            const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader
            const result = await handleWorkspaceStripeWebhook(env, {
              rawBody,
              signature: signature ?? null,
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, { received: true })
            return
          }
        } catch {
          sendJson(res, 502, { error: 'Could not complete that.' })
          return
        }

        sendJson(res, 405, { error: 'Method not allowed' })
      })
    },
  }
}
