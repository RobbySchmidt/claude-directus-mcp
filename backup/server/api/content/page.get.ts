import { readItems } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'
import { toDirectusLocale } from '~~/server/utils/i18n'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.slug as string
  const locale = toDirectusLocale(query.locale)
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug required' })

  const directus = useDirectusServer()

  const rows = await directus.request(readItems('pages', {
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
      'translations.*',
      'blocks.*',
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deep: {
      translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 },
    } as any,
    limit: 1,
  }))

  if (!rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found in this locale' })
  }
  const page = rows[0] as any
  const t = page.translations?.[0]
  if (!t) throw createError({ statusCode: 404, statusMessage: 'Translation missing' })

  const altRows = await directus.request(readItems('pages_translations', {
    filter: { pages_id: { _eq: page.id } },
    fields: ['languages_code', 'slug'],
    limit: -1,
  }))

  const { translations, ...rest } = page
  return {
    ...rest,
    ...t,
    alternate_locales: Object.fromEntries((altRows as any[]).map((a: any) => [a.languages_code, a.slug])),
  }
})
