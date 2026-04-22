import { directusAuthFetch } from '~~/server/utils/directus-user'
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshToken,
} from '~~/server/utils/auth-cookies'

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshToken(event)
  if (!refreshToken) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet' })
  }
  try {
    const tokens = await directusAuthFetch<{ access_token: string; refresh_token: string; expires: number }>(
      '/auth/refresh',
      { method: 'POST', body: { refresh_token: refreshToken, mode: 'json' } },
    )
    setAuthCookies(event, tokens.access_token, tokens.refresh_token, tokens.expires)
    return { ok: true }
  } catch {
    clearAuthCookies(event)
    throw createError({ statusCode: 401, statusMessage: 'Refresh fehlgeschlagen' })
  }
})
