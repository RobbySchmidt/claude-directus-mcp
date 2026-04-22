import type { AuthResult, PasswordResetInput } from '~~/shared/types/auth'
import { directusAuthFetch } from '~~/server/utils/directus-user'

const MIN_PASSWORD_LEN = 8

export default defineEventHandler(async (event): Promise<AuthResult> => {
  const body = await readBody<PasswordResetInput>(event)
  if (!body?.token || !body?.password) {
    return { ok: false, error: 'invalid_token', message: 'Ungültiger Reset-Link' }
  }
  if (body.password.length < MIN_PASSWORD_LEN) {
    return { ok: false, error: 'weak_password', message: `Passwort muss mindestens ${MIN_PASSWORD_LEN} Zeichen lang sein` }
  }
  try {
    await directusAuthFetch('/auth/password/reset', {
      method: 'POST',
      body: { token: body.token, password: body.password },
    })
    return { ok: true, data: undefined }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: { directus?: { extensions?: { code?: string } } } }
    const code = e.data?.directus?.extensions?.code
    if (code === 'TOKEN_EXPIRED') {
      return { ok: false, error: 'token_expired', message: 'Reset-Link abgelaufen — bitte erneut anfordern' }
    }
    if (code === 'INVALID_TOKEN' || e.statusCode === 401 || e.statusCode === 403) {
      return { ok: false, error: 'invalid_token', message: 'Ungültiger oder bereits verwendeter Reset-Link' }
    }
    return { ok: false, error: 'server_error', message: 'Passwort konnte nicht zurückgesetzt werden' }
  }
})
