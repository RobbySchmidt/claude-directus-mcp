import type { AuthResult, AuthUser, RegisterInput } from '~~/shared/types/auth'
import { directusAuthFetch, createUserClient } from '~~/server/utils/directus-user'
import { setAuthCookies } from '~~/server/utils/auth-cookies'
import { readMe } from '@directus/sdk'

const MIN_PASSWORD_LEN = 8

export default defineEventHandler(async (event): Promise<AuthResult<AuthUser>> => {
  const body = await readBody<RegisterInput>(event)
  if (!body?.email || !body?.password) {
    return { ok: false, error: 'invalid_credentials', message: 'E-Mail und Passwort erforderlich' }
  }
  if (body.password.length < MIN_PASSWORD_LEN) {
    return { ok: false, error: 'weak_password', message: `Passwort muss mindestens ${MIN_PASSWORD_LEN} Zeichen lang sein` }
  }

  // 1. Register
  try {
    await directusAuthFetch('/users/register', {
      method: 'POST',
      body: { email: body.email, password: body.password },
    })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: { directus?: { extensions?: { code?: string } } } }
    const code = e.data?.directus?.extensions?.code
    if (code === 'RECORD_NOT_UNIQUE') {
      return { ok: false, error: 'email_taken', message: 'Diese E-Mail ist bereits vergeben' }
    }
    if (e.statusCode === 403) {
      return { ok: false, error: 'registration_disabled', message: 'Registrierung derzeit nicht möglich' }
    }
    return { ok: false, error: 'server_error', message: 'Unerwarteter Fehler bei der Registrierung' }
  }

  // 2. Auto-login
  let tokens: { access_token: string; refresh_token: string; expires: number }
  try {
    tokens = await directusAuthFetch('/auth/login', {
      method: 'POST',
      body: { email: body.email, password: body.password, mode: 'json' },
    })
  } catch {
    return { ok: false, error: 'server_error', message: 'Account angelegt, aber Login fehlgeschlagen — bitte manuell anmelden' }
  }
  setAuthCookies(event, tokens.access_token, tokens.refresh_token, tokens.expires)

  const client = createUserClient(tokens.access_token)
  const me = (await client.request(
    readMe({ fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status'] }),
  )) as AuthUser
  return { ok: true, data: me }
})
