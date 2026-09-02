import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { writeSitemap } from './sitemap.ts'

const FILES = {
  pages: 'src/content/pages.json',
  questions: 'src/content/questions.json',
  followup: 'src/content/followup.json',
  types: 'src/content/types.json',
  guides: 'src/content/guides.json',
} as const

const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

type CmsFile = keyof typeof FILES

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

export function cmsPlugin(adminPassword: string): Plugin {
  const password = adminPassword || 'jung'
  const usingDefault = !adminPassword

  return {
    name: 'jung-cms',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__cms')) {
          next()
          return
        }

        if (req.method === 'GET' && req.url === '/__cms/status') {
          sendJson(res, 200, {
            writable: true,
            configured: true,
            usingDefault,
          })
          return
        }

        if (req.method === 'POST' && req.url === '/__cms/login') {
          let payload: { password?: string }
          try {
            payload = JSON.parse(await readBody(req)) as typeof payload
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON' })
            return
          }
          if (payload.password !== password) {
            sendJson(res, 401, { error: 'Wrong password' })
            return
          }
          sendJson(res, 200, { ok: true })
          return
        }

        if (req.method === 'POST' && req.url === '/__cms/save') {
          let payload: { password?: string; file?: string; data?: unknown }
          try {
            payload = JSON.parse(await readBody(req)) as typeof payload
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON' })
            return
          }

          if (payload.password !== password) {
            sendJson(res, 401, { error: 'Wrong password' })
            return
          }

          const file = payload.file
          if (
            file !== 'pages' &&
            file !== 'questions' &&
            file !== 'followup' &&
            file !== 'types' &&
            file !== 'guides'
          ) {
            sendJson(res, 400, { error: 'Unknown file' })
            return
          }

          const dest = path.resolve(process.cwd(), FILES[file as CmsFile])
          fs.writeFileSync(dest, `${JSON.stringify(payload.data, null, 2)}\n`)
          if (file === 'guides' && Array.isArray(payload.data)) {
            const slugs = payload.data
              .map((item) => (item && typeof item === 'object' && 'slug' in item ? String(item.slug) : ''))
              .filter(Boolean)
            writeSitemap(slugs)
          }
          sendJson(res, 200, { ok: true })
          return
        }

        if (req.method === 'POST' && req.url === '/__cms/upload') {
          let payload: { password?: string; code?: string; dataUrl?: string }
          try {
            payload = JSON.parse(await readBody(req)) as typeof payload
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON' })
            return
          }

          if (payload.password !== password) {
            sendJson(res, 401, { error: 'Wrong password' })
            return
          }

          const code = payload.code?.toUpperCase() ?? ''
          if (!/^[A-Z][A-Z0-9-]{0,31}$/.test(code)) {
            sendJson(res, 400, { error: 'Unknown image name' })
            return
          }

          const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(payload.dataUrl ?? '')
          if (!match) {
            sendJson(res, 400, { error: 'That file is not a usable image' })
            return
          }

          const ext = IMAGE_TYPES[match[1] ?? '']
          if (!ext) {
            sendJson(res, 400, { error: 'Use png, jpg, webp, gif, or svg' })
            return
          }

          const bytes = Buffer.from(match[2] ?? '', 'base64')
          if (bytes.length > 2_000_000) {
            sendJson(res, 400, { error: 'Keep the image under 2 MB' })
            return
          }

          const folder = code === 'HOME' ? 'public/home' : 'public/types'
          const filename = code === 'HOME' ? `hero.${ext}` : `${code}.${ext}`
          const dir = path.resolve(process.cwd(), folder)
          fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, filename), bytes)
          const publicPath = code === 'HOME' ? `/home/${filename}` : `/types/${filename}`
          sendJson(res, 200, { path: `${publicPath}?v=${Date.now()}` })
          return
        }

        next()
      })
    },
  }
}
