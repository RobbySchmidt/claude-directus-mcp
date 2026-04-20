import { readSingleton } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'

export default defineEventHandler(async () => {
  const directus = useDirectusServer()
  const general = await directus.request(
    readSingleton('general', {
      fields: [
        'id',
        'homepage.id',
        'homepage.slug',
        'homepage.title',
        'homepage.status',
        'homepage.seo.*',
        'homepage.blocks.collection',
        'homepage.blocks.item',
        'homepage.blocks.sort',
      ],
    }),
  )
  const page = general?.homepage
  if (!page) throw createError({ statusCode: 404, statusMessage: 'general.homepage not configured' })
  return page
})
