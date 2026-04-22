import type { AuthUser } from '~~/shared/types/auth'
import { readMe } from '@directus/sdk'
import { createUserClient } from '~~/server/utils/directus-user'
import { getAccessToken } from '~~/server/utils/auth-cookies'

export default defineEventHandler(async (event): Promise<AuthUser | null> => {
  const token = getAccessToken(event)
  if (!token) return null

  try {
    const client = createUserClient(token)
    return (await client.request(
      readMe({ fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status'] }),
    )) as AuthUser
  } catch {
    return null
  }
})
