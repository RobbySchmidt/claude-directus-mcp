import { directusAuthFetch } from '~~/server/utils/directus-user'
import { clearAuthCookies, getRefreshToken } from '~~/server/utils/auth-cookies'

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshToken(event)
  if (refreshToken) {
    try {
      await directusAuthFetch('/auth/logout', {
        method: 'POST',
        body: { refresh_token: refreshToken, mode: 'json' },
      })
    } catch {
      // best-effort — even if Directus rejects, we still clear our cookies
    }
  }
  clearAuthCookies(event)
  return { ok: true }
})
