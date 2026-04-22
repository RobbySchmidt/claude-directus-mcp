import type { AuthResult, PasswordRequestInput } from '~~/shared/types/auth'
import { directusAuthFetch } from '~~/server/utils/directus-user'

export default defineEventHandler(async (event): Promise<AuthResult> => {
  const body = await readBody<PasswordRequestInput>(event)
  if (!body?.email) {
    return { ok: false, error: 'invalid_credentials', message: 'E-Mail erforderlich' }
  }
  // Construct the absolute URL the user will land on
  const cfg = useRuntimeConfig()
  const reset_url = `${cfg.public.siteUrl}/passwort-ruecksetzen`
  try {
    await directusAuthFetch('/auth/password/request', {
      method: 'POST',
      body: { email: body.email, reset_url },
    })
  } catch {
    // Directus intentionally returns 204 even for unknown emails to prevent enumeration.
    // If we DO get an error, it's a real server issue — but we still respond ok to the client
    // for the same enumeration-resistance reason.
  }
  return { ok: true, data: undefined }
})
