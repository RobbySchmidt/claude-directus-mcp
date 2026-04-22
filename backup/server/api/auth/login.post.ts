import type { AuthResult, AuthUser, LoginInput } from '~~/shared/types/auth'
import { directusAuthFetch, createUserClient } from '~~/server/utils/directus-user'
import { setAuthCookies } from '~~/server/utils/auth-cookies'
import { readMe } from '@directus/sdk'

export default defineEventHandler(async (event): Promise<AuthResult<AuthUser>> => {
  const body = await readBody<LoginInput>(event)
  if (!body?.email || !body?.password) {
    return { ok: false, error: 'invalid_credentials', message: 'E-Mail und Passwort erforderlich' }
  }

  let tokens: { access_token: string; refresh_token: string; expires: number }
  try {
    tokens = await directusAuthFetch('/auth/login', {
      method: 'POST',
      body: { email: body.email, password: body.password, mode: 'json' },
    })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: { directus?: { extensions?: { code?: string } } } }
    const code = e.data?.directus?.extensions?.code
    if (code === 'INVALID_CREDENTIALS' || e.statusCode === 401) {
      return { ok: false, error: 'invalid_credentials', message: 'E-Mail oder Passwort falsch' }
    }
    if (code === 'USER_SUSPENDED') {
      return { ok: false, error: 'account_suspended', message: 'Account gesperrt — bitte kontaktieren Sie uns' }
    }
    return { ok: false, error: 'server_error', message: 'Unerwarteter Fehler beim Anmelden' }
  }

  setAuthCookies(event, tokens.access_token, tokens.refresh_token, tokens.expires)

  const client = createUserClient(tokens.access_token)
  const me = (await client.request(
    readMe({ fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status'] }),
  )) as AuthUser
  return { ok: true, data: me }
})
