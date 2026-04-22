import type { H3Event } from 'h3'
import { readMe } from '@directus/sdk'
import { getAccessToken } from './auth-cookies'
import { createUserClient } from './directus-user'

/**
 * Return the current user's id extracted from the auth cookie.
 * Returns null if no cookie or the token is invalid — caller handles
 * the unauthorized response (so each route can return its typed
 * `{ ok: false, error: 'unauthorized', ... }` shape).
 */
export async function getCurrentUserId(event: H3Event): Promise<string | null> {
  const token = getAccessToken(event)
  if (!token) return null
  try {
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['id'] }))) as { id: string }
    return me.id
  } catch {
    return null
  }
}
