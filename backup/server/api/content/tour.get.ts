import { readItems } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'
import { toDirectusLocale } from '~~/server/utils/i18n'
import { getBelegungProTermin } from '~~/server/utils/kapazitaet'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.slug as string
  const locale = toDirectusLocale(query.locale)
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug required' })

  const directus = useDirectusServer()

  const rows = await directus.request(readItems('touren', {
    filter: {
      status: { _eq: 'published' },
      translations: {
        _and: [
          { languages_code: { _eq: locale } },
          { slug: { _eq: slug } },
        ],
      },
    },
    fields: [
      '*',
      'gallery.directus_files_id.*',
      'translations.*',
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deep: {
      translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 },
    } as any,
    limit: 1,
  }))

  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Tour not found in this locale' })
  }
  const tour = rows[0] as any
  const t = tour.translations?.[0]
  if (!t) throw createError({ statusCode: 404, statusMessage: 'Translation missing' })

  // alternate_locales: slugs per language for the language switcher
  const altRows = await directus.request(readItems('touren_translations', {
    filter: { touren_id: { _eq: tour.id } },
    fields: ['languages_code', 'slug'],
    limit: -1,
  }))

  // Termine with hinweis-translation (fallback to null if locale missing)
  const termineRaw = await directus.request(readItems('tour_termine', {
    filter: {
      status: { _eq: 'published' },
      tour: { _eq: tour.id },
      date_from: { _gte: new Date().toISOString().slice(0, 10) },
    },
    fields: ['*', 'translations.*'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deep: {
      translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 },
    } as any,
    sort: ['sort', 'date_from'],
  }))

  const belegung = await getBelegungProTermin((termineRaw as any[]).map((t: any) => t.id))

  const termine = (termineRaw as any[]).map((termin: any) => {
    const tt = termin.translations?.[0] ?? {}
    const { translations: _drop, ...rest } = termin
    const groupSizeMax = tour.group_size_max ?? null
    if (groupSizeMax === null) {
      return { ...rest, hinweis: tt.hinweis ?? null, verfuegbare_plaetze: -1, ausgebucht: false }
    }
    const belegt = belegung[termin.id] ?? 0
    const frei = Math.max(0, groupSizeMax - belegt)
    return { ...rest, hinweis: tt.hinweis ?? null, verfuegbare_plaetze: frei, ausgebucht: frei <= 0 }
  })

  // Flatten gallery m2m wrapper: [{ directus_files_id: { ... } }] → [{ ... }]
  const gallery = Array.isArray(tour.gallery)
    ? (tour.gallery as any[]).map((g: any) => g?.directus_files_id ?? g).filter(Boolean)
    : []

  const { translations, gallery: _g, ...rest } = tour
  return {
    ...rest,
    ...t,
    gallery,
    termine,
    alternate_locales: Object.fromEntries((altRows as any[]).map((a: any) => [a.languages_code, a.slug])),
  }
})
