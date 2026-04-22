import { readItems } from '@directus/sdk'
import type { BuchungListItem, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getCurrentUserId } from '~~/server/utils/require-user'

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungListItem[]>> => {
  const userId = await getCurrentUserId(event)
  if (!userId) return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }

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
