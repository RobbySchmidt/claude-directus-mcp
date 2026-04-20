import { readItem } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'

const ALLOWED_COLLECTIONS = new Set([
  'block_heroBanner',
  'block_statsBand',
  'block_tourGrid',
  'block_benefits',
  'block_regionList',
  'block_testimonials',
  'block_newsletter',
])

export default defineEventHandler(async (event) => {
  const { collection, id, fields } = getQuery(event) as {
    collection?: string
    id?: string
    fields?: string
  }
  if (!collection || !id) {
    throw createError({ statusCode: 400, statusMessage: 'collection and id required' })
  }
  if (!ALLOWED_COLLECTIONS.has(collection)) {
    throw createError({ statusCode: 400, statusMessage: `collection "${collection}" not allowed` })
  }

  const parsedFields = fields ? fields.split(',') : ['*', '*.*']
  const directus = useDirectusServer()
  return await directus.request(readItem(collection, id, { fields: parsedFields }))
})
