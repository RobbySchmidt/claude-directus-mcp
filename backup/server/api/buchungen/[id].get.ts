import { readItems } from '@directus/sdk'
import type { BuchungDetail, BuchungResult } from '~~/shared/types/buchung'
import { useDirectusServer } from '~~/server/utils/directus'
import { getCurrentUserId } from '~~/server/utils/require-user'
import { BUCHUNG_DETAIL_FIELDS } from '~~/server/utils/buchungen-fields'

export default defineEventHandler(async (event): Promise<BuchungResult<BuchungDetail>> => {
  const userId = await getCurrentUserId(event)
  if (!userId) return { ok: false, error: 'unauthorized', message: 'Bitte melde dich an.' }

  const id = getRouterParam(event, 'id')
  if (!id) return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: { id: { _eq: id }, user: { _eq: userId } },
      fields: [...BUCHUNG_DETAIL_FIELDS],
      limit: 1,
    }),
  )) as BuchungDetail[]

  if (rows.length === 0) {
    return { ok: false, error: 'buchung_not_found', message: 'Buchung nicht gefunden.' }
  }

  return { ok: true, data: rows[0] }
})
