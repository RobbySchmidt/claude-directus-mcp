import { createDirectus, rest, staticToken } from '@directus/sdk'

/**
 * Build a Directus SDK client authenticated with the given user access_token.
 * Use this for per-user mutations (e.g. PATCH /users/me).
 */
export function createUserClient(accessToken: string) {
  const cfg = useRuntimeConfig()
  const url = cfg.public.directusUrl
  if (!url) {
    throw createError({ statusCode: 500, statusMessage: 'directusUrl missing in runtimeConfig' })
  }
  return createDirectus(url).with(staticToken(accessToken)).with(rest())
}

/**
 * Direct fetch helper for the auth endpoints (login/refresh/logout/password)
 * — these don't fit the SDK's auth flow because we manage cookies ourselves.
 */
export async function directusAuthFetch<T = unknown>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown; token?: string } = { method: 'GET' },
): Promise<T> {
  const cfg = useRuntimeConfig()
  const url = cfg.public.directusUrl
  if (!url) {
    throw createError({ statusCode: 500, statusMessage: 'directusUrl missing in runtimeConfig' })
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (init.token) headers.Authorization = `Bearer ${init.token}`

  const res = await fetch(`${url}${path}`, {
    method: init.method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const directusErr = data?.errors?.[0]
    throw createError({
      statusCode: res.status,
      statusMessage: directusErr?.message ?? `Directus auth call failed (${res.status})`,
      data: { directus: directusErr },
    })
  }

  return data?.data ?? data
}
