import { readItems, readMe } from '@directus/sdk'
import type { BuchungListItem, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getAccessToken } from '~~/server/utils/auth-cookies'
import { createUserClient } from '~~/server/utils/directus-user'

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungListItem[]>> => {
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

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: { user: { _eq: userId } },
      fields: [
        'id', 'status', 'date_created', 'personen_anzahl', 'preis_gesamt',
        'wunsch_datum',
        'tour.id', 'tour.slug', 'tour.title',
        'termin.id', 'termin.date_from', 'termin.date_to', 'termin.hinweis',
      ],
      sort: ['-date_created'],
      limit: -1,
    }),
  )) as BuchungListItem[]

  return { ok: true, data: rows }
})
