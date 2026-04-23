export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // Skip static assets and API routes
  if (
    path.startsWith('/_nuxt/') ||
    path.startsWith('/api/') ||
    path.startsWith('/__') ||
    /\.(svg|png|jpg|jpeg|ico|css|js|json|xml|webp|woff|woff2|ttf|map)$/.test(path)
  ) {
    return
  }

  // Skip already-prefixed paths and root
  if (
    path === '/' ||
    path.startsWith('/de/') ||
    path.startsWith('/en/') ||
    path === '/de' ||
    path === '/en'
  ) {
    return
  }

  // Bare path (e.g. /touren/koenigssee-rundweg) → 301 to /de/...
  return sendRedirect(event, `/de${path}`, 301)
})
