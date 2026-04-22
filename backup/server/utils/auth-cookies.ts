import type { H3Event } from 'h3'

const ACCESS_COOKIE = 'directus_at'
const REFRESH_COOKIE = 'directus_rt'

const baseOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: !import.meta.dev,
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
})

export function setAuthCookies(
  event: H3Event,
  accessToken: string,
  refreshToken: string,
  accessExpires: number, // Directus returns expires in ms
) {
  // access cookie expires when token expires (rounded to seconds)
  setCookie(event, ACCESS_COOKIE, accessToken, baseOptions(Math.floor(accessExpires / 1000)))
  // refresh cookie: 7 days (Directus default REFRESH_TOKEN_TTL)
  setCookie(event, REFRESH_COOKIE, refreshToken, baseOptions(60 * 60 * 24 * 7))
}

export function clearAuthCookies(event: H3Event) {
  deleteCookie(event, ACCESS_COOKIE, { path: '/' })
  deleteCookie(event, REFRESH_COOKIE, { path: '/' })
}

export function getAccessToken(event: H3Event): string | null {
  return getCookie(event, ACCESS_COOKIE) ?? null
}

export function getRefreshToken(event: H3Event): string | null {
  return getCookie(event, REFRESH_COOKIE) ?? null
}

export const COOKIE_NAMES = { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE }
