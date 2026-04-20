import { createDirectus, rest, staticToken } from '@directus/sdk'

let client: ReturnType<typeof build> | null = null

function build() {
  const cfg = useRuntimeConfig()
  const url = cfg.public.directusUrl
  const token = cfg.directusToken
  if (!url) throw createError({ statusCode: 500, statusMessage: 'directusUrl missing in runtimeConfig' })
  if (!token) throw createError({ statusCode: 500, statusMessage: 'directusToken missing in runtimeConfig' })
  return createDirectus(url).with(staticToken(token)).with(rest())
}

export function useDirectusServer() {
  if (!client) client = build()
  return client
}
