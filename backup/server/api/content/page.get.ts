import { readItems } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'

export default defineEventHandler(async (event) => {
  const { slug } = getQuery(event) as { slug?: string }
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug query param required' })

  const directus = useDirectusServer()
  const pages = await directus.request(
    readItems('pages', {
      filter: { status: { _eq: 'published' }, slug: { _eq: slug } },
      fields: ['*', 'seo.*', 'blocks.collection', 'blocks.item', 'blocks.sort'],
      limit: 1,
    }),
  )
  const page = pages[0]
  if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  return page
})
