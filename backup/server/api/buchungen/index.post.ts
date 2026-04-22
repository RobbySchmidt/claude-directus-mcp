import { readItems, createItem, readItem, readMe } from '@directus/sdk'
import type { BuchungCreateInput, BuchungResult, BuchungDetail } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getBelegungProTermin } from '~~/server/utils/kapazitaet'
import { sendMail, renderBuchungTemplate } from '~~/server/utils/mailer'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungDetail>> => {
  const token = getAccessToken(event)
  if (!token) {
    return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }
  }
  let userId: string
  try {
    const client = createUserClient(token)
    const me = (await client.request(readMe({ fields: ['id'] }))) as { id: string }
    userId = me.id
  } catch {
    return { ok: false, error: 'unauthorized', message: 'Session ungültig.' }
  }

  const body = await readBody<BuchungCreateInput>(event)
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'server_error', message: 'Ungültige Anfrage.' }
  }

  if (!body.tour || typeof body.tour !== 'string') {
    return { ok: false, error: 'tour_not_found', message: 'Tour fehlt.' }
  }
  if (!Number.isInteger(body.personen_anzahl) || body.personen_anzahl < 1) {
    return { ok: false, error: 'personen_anzahl_invalid', message: 'Personenzahl ungültig.' }
  }
  if (!body.kontakt_vorname || !body.kontakt_nachname) {
    return { ok: false, error: 'server_error', message: 'Bitte Vor- und Nachname angeben.' }
  }
  if (!body.kontakt_email || !EMAIL_REGEX.test(body.kontakt_email)) {
    return { ok: false, error: 'invalid_email', message: 'Kontakt-E-Mail ist ungültig.' }
  }
  if (!body.kontakt_telefon) {
    return { ok: false, error: 'server_error', message: 'Bitte Telefonnummer angeben.' }
  }

  const hasTermin = !!body.termin
  const hasWunsch = !!body.wunsch_datum
  if (!hasTermin && !hasWunsch) {
    return {
      ok: false,
      error: 'missing_termin_or_wunsch',
      message: 'Bitte wähle einen Termin oder gib ein Wunschdatum an.',
    }
  }
  if (hasTermin && hasWunsch) {
    return {
      ok: false,
      error: 'both_termin_and_wunsch',
      message: 'Bitte wähle entweder einen festen Termin ODER ein Wunschdatum.',
    }
  }
  if (hasWunsch && !ISO_DATE.test(body.wunsch_datum!)) {
    return { ok: false, error: 'wunsch_datum_past', message: 'Wunschdatum hat ein ungültiges Format.' }
  }
  if (hasWunsch && body.wunsch_datum! < today()) {
    return { ok: false, error: 'wunsch_datum_past', message: 'Wunschdatum muss in der Zukunft liegen.' }
  }

  const directus = useDirectusServer()

  const tours = (await directus.request(
    readItems('touren', {
      filter: { id: { _eq: body.tour }, status: { _eq: 'published' } },
      fields: ['id', 'title', 'slug', 'price_from', 'group_size_max', 'status'],
      limit: 1,
    }),
  )) as Array<{
    id: string
    title: string
    slug: string
    price_from: number | null
    group_size_max: number | null
    status: string
  }>
  if (tours.length === 0) {
    return { ok: false, error: 'tour_not_found', message: 'Tour nicht gefunden.' }
  }
  const tour = tours[0]

  let priceEinzeln = tour.price_from ?? 0
  if (hasTermin) {
    const termin = (await directus
      .request(
        readItem('tour_termine', body.termin!, {
          fields: ['id', 'tour', 'date_from', 'price_override', 'status'],
        }),
      )
      .catch(() => null)) as
      | { id: string; tour: string; date_from: string; price_override: number | null; status: string }
      | null

    if (!termin) {
      return { ok: false, error: 'termin_invalid', message: 'Termin nicht gefunden.' }
    }
    if (termin.tour !== tour.id) {
      return { ok: false, error: 'termin_invalid', message: 'Termin gehört zu einer anderen Tour.' }
    }
    if (termin.status !== 'published') {
      return { ok: false, error: 'termin_invalid', message: 'Termin ist nicht verfügbar.' }
    }
    if (termin.date_from < today()) {
      return { ok: false, error: 'termin_past', message: 'Termin liegt in der Vergangenheit.' }
    }
    if (termin.price_override !== null) {
      priceEinzeln = termin.price_override
    }

    if (tour.group_size_max !== null) {
      const belegung = await getBelegungProTermin([termin.id])
      const belegt = belegung[termin.id] ?? 0
      if (belegt + body.personen_anzahl > tour.group_size_max) {
        return {
          ok: false,
          error: 'termin_ausgebucht',
          message: 'Termin wurde gerade ausgebucht — bitte wähle einen anderen.',
        }
      }
    }
  }

  const preisGesamt = priceEinzeln * body.personen_anzahl

  const created = (await directus.request(
    createItem('buchungen', {
      status: 'angefragt',
      user: userId,
      tour: tour.id,
      termin: hasTermin ? body.termin : null,
      wunsch_datum: hasWunsch ? body.wunsch_datum : null,
      personen_anzahl: body.personen_anzahl,
      preis_gesamt: preisGesamt,
      kontakt_vorname: body.kontakt_vorname,
      kontakt_nachname: body.kontakt_nachname,
      kontakt_email: body.kontakt_email,
      kontakt_telefon: body.kontakt_telefon,
      notizen: body.notizen ?? null,
    }),
  )) as { id: string }

  const detail = (await directus.request(
    readItem('buchungen', created.id, {
      fields: [
        'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
        'kontakt_vorname', 'kontakt_nachname', 'kontakt_email', 'kontakt_telefon', 'notizen',
        'wunsch_datum',
        'tour.id', 'tour.slug', 'tour.title',
        'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
      ],
    }),
  )) as BuchungDetail

  const adminTo = process.env.EMAIL_ADMIN
  try {
    if (adminTo) {
      const t1 = renderBuchungTemplate('admin_neu', detail)
      await sendMail({ to: adminTo, subject: t1.subject, html: t1.html, text: t1.text })
    } else {
      console.warn('[buchungen] EMAIL_ADMIN not set — admin notification skipped')
    }
  } catch (err) {
    console.error('[buchungen] admin mail failed:', err)
  }
  try {
    const t2 = renderBuchungTemplate('user_eingangsbestaetigung', detail)
    await sendMail({ to: detail.kontakt_email, subject: t2.subject, html: t2.html, text: t2.text })
  } catch (err) {
    console.error('[buchungen] user confirmation mail failed:', err)
  }

  console.log('[buchungen] buchung_created', { buchung_id: detail.id, user_id: userId, tour_slug: detail.tour.slug })

  return { ok: true, data: detail }
})
