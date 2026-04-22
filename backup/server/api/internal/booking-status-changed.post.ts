import { readItems, updateItem } from '@directus/sdk'
import type { BuchungDetail, BuchungStatus } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { sendMail, renderBuchungTemplate } from '~~/server/utils/mailer'

type DirectusFlowEvent = {
  event?: string
  keys?: string[]
  payload?: { status?: string }
}

const TEMPLATE_FOR: Record<string, Parameters<typeof renderBuchungTemplate>[0] | null> = {
  bestaetigt: 'user_bestaetigt',
  storniert: 'user_storniert',
  abgelehnt: 'user_abgelehnt',
}

export default defineEventHandler(async (event) => {
  const expected = process.env.INTERNAL_WEBHOOK_SECRET
  const got = getHeader(event, 'x-internal-secret')
  if (!expected || got !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const body = await readBody<DirectusFlowEvent>(event)
  if (!body || !Array.isArray(body.keys) || !body.payload?.status) {
    return { ok: false, error: 'invalid_body' }
  }
  const newStatus = body.payload.status as BuchungStatus
  const template = TEMPLATE_FOR[newStatus]
  if (!template) {
    return { ok: true, skipped: `no-template-for-${newStatus}` }
  }

  const directus = useDirectusServer()
  const results: Array<{ id: string; sent: boolean; reason?: string }> = []

  for (const id of body.keys) {
    const rows = (await directus.request(
      readItems('buchungen', {
        filter: { id: { _eq: id } },
        fields: [
          'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
          'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
          'wunsch_datum', 'last_notified_status',
          'tour.id', 'tour.slug', 'tour.title',
          'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
        ],
        limit: 1,
      }),
    )) as Array<BuchungDetail & { last_notified_status: string | null }>

    if (rows.length === 0) {
      results.push({ id, sent: false, reason: 'not_found' })
      continue
    }
    const b = rows[0]
    if (b.last_notified_status === newStatus) {
      results.push({ id, sent: false, reason: 'already_notified' })
      continue
    }

    try {
      const t = renderBuchungTemplate(template, b)
      await sendMail({ to: b.kontakt_email, subject: t.subject, html: t.html, text: t.text })
      await directus.request(updateItem('buchungen', b.id, { last_notified_status: newStatus }))
      console.log('[buchungen] booking_status_mail_sent', {
        buchung_id: b.id,
        new_status: newStatus,
        to: b.kontakt_email,
      })
      results.push({ id, sent: true })
    } catch (err) {
      console.error('[buchungen] mail_send_failed', { buchung_id: b.id, new_status: newStatus, error: err })
      results.push({ id, sent: false, reason: 'mail_error' })
    }
  }

  return { ok: true, results }
})
