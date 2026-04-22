import { readItems, updateItem, readMe } from '@directus/sdk'
import type { BuchungDetail, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'
import { sendMail, renderBuchungTemplate } from '~~/server/utils/mailer'

const DAY_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungDetail>> => {
  const token = getAccessToken(event)
  if (!token) return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }

  let userId: string
  try {
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['id'] }))) as { id: string }
    userId = me.id
  } catch {
    return { ok: false, error: 'unauthorized', message: 'Session ungültig.' }
  }

  const id = getRouterParam(event, 'id')
  if (!id) return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: { id: { _eq: id }, user: { _eq: userId } },
      fields: [
        'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
        'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
        'wunsch_datum',
        'tour.id', 'tour.slug', 'tour.title',
        'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
      ],
      limit: 1,
    }),
  )) as BuchungDetail[]

  if (rows.length === 0) {
    return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }
  }
  const b = rows[0]

  if (b.status === 'storniert') {
    return { ok: false, error: 'already_cancelled', message: 'Buchung ist bereits storniert.' }
  }
  if (b.status !== 'angefragt' && b.status !== 'bestaetigt') {
    return {
      ok: false,
      error: 'cancel_not_allowed_status',
      message: 'Buchung kann in diesem Status nicht mehr storniert werden.',
    }
  }

  if (b.termin) {
    const terminMs = new Date(b.termin.date_from + 'T00:00:00Z').getTime()
    if (terminMs - Date.now() < 14 * DAY_MS) {
      return {
        ok: false,
        error: 'cancel_not_allowed_deadline',
        message: 'Storno nicht mehr möglich — bitte telefonisch kontaktieren.',
      }
    }
  }

  await directus.request(
    updateItem('buchungen', b.id, {
      status: 'storniert',
      last_notified_status: 'storniert',
    }),
  )

  const updated: BuchungDetail = { ...b, status: 'storniert' }

  try {
    const t = renderBuchungTemplate('user_storniert', updated)
    await sendMail({ to: updated.kontakt_email, subject: t.subject, html: t.html, text: t.text })
  } catch (err) {
    console.error('[buchungen] storno mail failed:', err)
  }

  console.log('[buchungen] buchung_cancelled', { buchung_id: b.id, user_id: userId, reason: 'user_requested' })

  return { ok: true, data: updated }
})
