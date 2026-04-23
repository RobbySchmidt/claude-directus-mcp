import { readSingleton, readItem } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'
import { toDirectusLocale } from '~~/server/utils/i18n'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = toDirectusLocale(query.locale)

  const directus = useDirectusServer()

  const general = await directus.request(readSingleton('general', {
    fields: ['id', 'homepage'],
  }))

  if (!(general as any)?.homepage) {
    throw createError({ statusCode: 404, statusMessage: 'Homepage not configured' })
  }

  const page = await directus.request(readItem('pages', (general as any).homepage, {
    fields: [
      'id', 'status', 'seo',
      'translations.*',
      'blocks.*',
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deep: {
      translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 },
    } as any,
  }))

  const pageT = (page as any).translations?.[0]
  if (!pageT) {
    throw createError({ statusCode: 404, statusMessage: 'Homepage translation missing' })
  }

  const { translations, ...pageRest } = page as any
  return {
    ...pageRest,
    ...pageT,
  }
})
