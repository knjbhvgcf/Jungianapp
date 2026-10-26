import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  createWorkspaceCheckoutSession,
  createWorkspacePortalSession,
  type StripeEnv,
} from './src/lib/workspace/stripeServer.ts'

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
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

export function workspaceStripePlugin(env: StripeEnv): Plugin {
  return {
    name: 'jung-workspace-stripe',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = pathOf(req)
        if (path !== '/api/workspace-checkout' && path !== '/api/workspace-portal') {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        try {
          if (path === '/api/workspace-checkout' && req.method === 'POST') {
            let payload: { email?: string; customerId?: string }
            try {
              payload = JSON.parse(await readBody(req)) as typeof payload
            } catch {
              sendJson(res, 400, { error: 'Invalid JSON' })
              return
            }
            const email = String(payload.email ?? '').trim()
            if (!/^\S+@\S+\.\S+$/.test(email)) {
              sendJson(res, 400, { error: 'Need an email this house can belong to.' })
              return
            }
            const result = await createWorkspaceCheckoutSession(env, {
              email,
              origin: originOf(req),
              customerId: String(payload.customerId ?? '').trim() || undefined,
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, { url: result.url })
            return
          }

          if (path === '/api/workspace-portal' && req.method === 'POST') {
            let payload: { customerId?: string }
            try {
              payload = JSON.parse(await readBody(req)) as typeof payload
            } catch {
              sendJson(res, 400, { error: 'Invalid JSON' })
              return
            }
            const result = await createWorkspacePortalSession(env, {
              customerId: String(payload.customerId ?? '').trim(),
              origin: originOf(req),
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, { url: result.url })
            return
          }
        } catch {
          sendJson(res, 502, { error: 'Stripe could not complete that.' })
          return
        }

        sendJson(res, 405, { error: 'Method not allowed' })
      })
    },
  }
}
