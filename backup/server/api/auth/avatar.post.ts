import type { AuthResult, AuthUser } from '~~/shared/types/auth'
import { updateMe } from '@directus/sdk'
import { createUserClient } from '~~/server/utils/directus-user'
import { getAccessToken } from '~~/server/utils/auth-cookies'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_MIME = /^image\//

export default defineEventHandler(async (event): Promise<AuthResult<AuthUser>> => {
  const token = getAccessToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet' })
  }

  const form = await readMultipartFormData(event)
  const filePart = form?.find((p) => p.name === 'file')
  if (!filePart || !filePart.data) {
    return { ok: false, error: 'server_error', message: 'Keine Datei empfangen' }
  }
  if (filePart.data.length > MAX_BYTES) {
    return { ok: false, error: 'server_error', message: `Datei zu groß (max ${MAX_BYTES / 1024 / 1024} MB)` }
  }
  const mime = filePart.type ?? 'application/octet-stream'
  if (!ALLOWED_MIME.test(mime)) {
    return { ok: false, error: 'server_error', message: 'Nur Bild-Dateien erlaubt' }
  }

  // Upload file to Directus
  const cfg = useRuntimeConfig()
  const uploadForm = new FormData()
  uploadForm.append('file', new Blob([filePart.data], { type: mime }), filePart.filename ?? 'avatar')

  const res = await fetch(`${cfg.public.directusUrl}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: uploadForm,
  })
  if (!res.ok) {
    return { ok: false, error: 'server_error', message: `Upload fehlgeschlagen (${res.status})` }
  }
  const { data: file } = (await res.json()) as { data: { id: string } }

  // Set as user avatar
  const client = createUserClient(token)
  const updated = (await client.request(
    updateMe({ avatar: file.id }, { fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status'] }),
  )) as AuthUser
  return { ok: true, data: updated }
})
