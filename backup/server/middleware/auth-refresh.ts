import { directusAuthFetch } from '~~/server/utils/directus-user'
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '~~/server/utils/auth-cookies'

// Routes that explicitly do NOT need refresh attempts (they manage tokens themselves
// or run pre-login).
const SKIP_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/password-request',
  '/api/auth/password-reset',
])

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname
  if (!url.startsWith('/api/auth/')) return
  if (SKIP_PATHS.has(url)) return

  const accessToken = getAccessToken(event)
  if (accessToken) return // happy path

  const refreshToken = getRefreshToken(event)
  if (!refreshToken) return // not logged in — let the route return 401

  try {
    const data = await directusAuthFetch<{ access_token: string; refresh_token: string; expires: number }>(
      '/auth/refresh',
      { method: 'POST', body: { refresh_token: refreshToken, mode: 'json' } },
    )
    setAuthCookies(event, data.access_token, data.refresh_token, data.expires)
  } catch {
    clearAuthCookies(event)
  }
})
