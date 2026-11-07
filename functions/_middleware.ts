type PagesContext = {
  request: Request
  next: () => Promise<Response>
}

/** Path 301s copied from `public/_redirects`. A root middleware can skip that file. */
const PATH_MOVED: Record<string, string> = {
  '/dossier': '/type-in-depth',
  '/dossier/': '/type-in-depth',
  '/4-letter-code': '/four-letter-code',
  '/4-letter-code/': '/four-letter-code',
  '/the-stack': '/function-stack',
  '/the-stack/': '/function-stack',
}

/** Apex is canonical. Pages `_redirects` cannot 301 one hostname to another. */
export async function onRequest(context: PagesContext) {
  const url = new URL(context.request.url)
  let moved = false

  if (url.hostname === 'www.jungology.com') {
    url.hostname = 'jungology.com'
    url.protocol = 'https:'
    moved = true
  }

  const dest = PATH_MOVED[url.pathname]
  if (dest) {
    url.pathname = dest
    moved = true
  }

  if (moved) return Response.redirect(url.toString(), 301)
  return context.next()
}
