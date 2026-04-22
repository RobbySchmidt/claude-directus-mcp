import { readItems } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'

/**
 * For each termin id in `terminIds`, sum personen_anzahl across
 * non-cancelled/non-rejected buchungen. Missing ids map to 0.
 */
export async function getBelegungProTermin(
  terminIds: string[],
): Promise<Record<string, number>> {
  if (terminIds.length === 0) return {}

  const directus = useDirectusServer()
  const rows = (await directus.request(
    readItems('buchungen', {
      filter: {
        termin: { _in: terminIds },
        status: { _nin: ['storniert', 'abgelehnt'] },
      },
      fields: ['termin', 'personen_anzahl'],
      limit: -1,
    }),
  )) as Array<{ termin: string; personen_anzahl: number }>

  const result: Record<string, number> = {}
  for (const id of terminIds) result[id] = 0
  for (const r of rows) {
    result[r.termin] = (result[r.termin] ?? 0) + r.personen_anzahl
  }
  return result
}
