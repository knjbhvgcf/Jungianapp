import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  emptyCensus,
  isTypeCode,
  parseCensus,
  recordResult,
  type CensusSnapshot,
} from './src/lib/typeCensusShared.ts'

const STORE = path.resolve(process.cwd(), '.data/type-census.json')

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

function loadStore(): CensusSnapshot {
  try {
    return parseCensus(JSON.parse(fs.readFileSync(STORE, 'utf8')))
  } catch {
    return emptyCensus()
  }
}

function saveStore(snapshot: CensusSnapshot) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true })
  fs.writeFileSync(STORE, `${JSON.stringify(snapshot, null, 2)}\n`)
}

export function typeCensusPlugin(adminPassword: string): Plugin {
  const password = adminPassword || 'jung'

  return {
    name: 'jung-type-census',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.split('?')[0]?.startsWith('/api/type-stats')) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          let payload: { suggested?: string; selected?: string }
          try {
            payload = JSON.parse(await readBody(req)) as typeof payload
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON' })
            return
          }
          const suggested = String(payload.suggested ?? '').toUpperCase()
          const selected = String(payload.selected ?? '').toUpperCase()
          if (!isTypeCode(suggested) || !isTypeCode(selected)) {
            sendJson(res, 400, { error: 'Unknown type' })
            return
          }
          saveStore(recordResult(loadStore(), suggested, selected))
          sendJson(res, 200, { ok: true })
          return
        }

        if (req.method === 'GET') {
          const header = req.headers.authorization ?? ''
          const token = header.startsWith('Bearer ') ? header.slice(7) : ''
          if (token !== password) {
            sendJson(res, 401, { error: 'Wrong password' })
            return
          }
          sendJson(res, 200, { configured: true, ...loadStore() })
          return
        }

        sendJson(res, 405, { error: 'Method not allowed' })
      })
    },
  }
}
