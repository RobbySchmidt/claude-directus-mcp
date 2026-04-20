import { Buffer } from 'node:buffer'
import { useDirectusServer } from '~~/server/utils/directus'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'file id required' })

  useDirectusServer()
  const cfg = useRuntimeConfig()
  const res = await fetch(`${cfg.public.directusUrl}/assets/${id}`, {
    headers: { Authorization: `Bearer ${cfg.directusToken}` },
  })
  if (!res.ok) throw createError({ statusCode: res.status, statusMessage: res.statusText })

  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const buf = Buffer.from(await res.arrayBuffer())
  setHeader(event, 'content-type', contentType)
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  return buf
})
