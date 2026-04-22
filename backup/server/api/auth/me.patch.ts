import type { AuthResult, AuthUser, ProfileUpdateInput, PasswordChangeInput } from '~~/shared/types/auth'
import { readMe, updateMe } from '@directus/sdk'
import { createUserClient, directusAuthFetch } from '~~/server/utils/directus-user'
import { getAccessToken } from '~~/server/utils/auth-cookies'

const ALLOWED_FIELDS = ['email', 'first_name', 'last_name', 'avatar'] as const

const MIN_PASSWORD_LEN = 8

type Body = ProfileUpdateInput & Partial<PasswordChangeInput>

export default defineEventHandler(async (event): Promise<AuthResult<AuthUser>> => {
  const token = getAccessToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet' })
  }
  const body = await readBody<Body>(event)
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'server_error', message: 'Ungültiger Request' }
  }

  // Filter to allowed profile fields
  const profilePatch: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) profilePatch[key] = body[key]
  }

  // Optional password change — needs current_password verification via re-login
  if (body.new_password) {
    if (!body.current_password) {
      return { ok: false, error: 'invalid_credentials', message: 'Aktuelles Passwort erforderlich' }
    }
    if (body.new_password.length < MIN_PASSWORD_LEN) {
      return { ok: false, error: 'weak_password', message: `Passwort muss mindestens ${MIN_PASSWORD_LEN} Zeichen lang sein` }
    }
    // verify current password by attempting login with the user's current email
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['email'] }))) as { email: string }
    try {
      await directusAuthFetch('/auth/login', {
        method: 'POST',
        body: { email: me.email, password: body.current_password, mode: 'json' },
      })
    } catch {
      return { ok: false, error: 'invalid_credentials', message: 'Aktuelles Passwort ist falsch' }
    }
    profilePatch.password = body.new_password
  }

  if (Object.keys(profilePatch).length === 0) {
    return { ok: false, error: 'server_error', message: 'Keine Änderungen' }
  }

  try {
    const client = createUserClient(token)
    const updated = (await client.request(
      updateMe(profilePatch, { fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status'] }),
    )) as AuthUser
    return { ok: true, data: updated }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: { directus?: { extensions?: { code?: string } } } }
    if (e.data?.directus?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      return { ok: false, error: 'email_taken', message: 'Diese E-Mail ist bereits vergeben' }
    }
    return { ok: false, error: 'server_error', message: 'Speichern fehlgeschlagen' }
  }
})
