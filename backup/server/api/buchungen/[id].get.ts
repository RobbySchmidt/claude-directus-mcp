import { readItems, readMe } from '@directus/sdk'
import type { BuchungDetail, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'

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

  return { ok: true, data: rows[0] }
})
