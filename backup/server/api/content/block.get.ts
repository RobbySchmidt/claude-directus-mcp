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

const TOUR_GRID_FIELDS = [
  'id',
  'eyebrow',
  'headline',
  'lead',
  'cta_label',
  'cta_href',
  'tours.id',
  'tours.sort',
  'tours.touren_id.id',
  'tours.touren_id.slug',
  'tours.touren_id.title',
  'tours.touren_id.region',
  'tours.touren_id.difficulty',
  'tours.touren_id.variant',
  'tours.touren_id.distance',
  'tours.touren_id.ascent',
  'tours.touren_id.duration',
]

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

  const directus = useDirectusServer()

  if (collection === 'block_tourGrid') {
    const item = (await directus.request(
      readItem(collection, id, {
        fields: TOUR_GRID_FIELDS,
        // deep query: sort junction entries by `sort`, only published touren
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deep: { tours: { _sort: ['sort'], _filter: { touren_id: { status: { _eq: 'published' } } } } } as any,
      }),
    )) as {
      id: string
      eyebrow: string | null
      headline: string | null
      lead: string | null
      cta_label: string | null
      cta_href: string | null
      tours: Array<{
        id: number
        sort: number | null
        touren_id: {
          id: string
          slug: string
          title: string
          region: string
          difficulty: string
          variant: string
          distance: string
          ascent: string
          duration: string
        } | null
      }> | null
    }

    return {
      ...item,
      tours: (item.tours ?? [])
        .filter((j) => j.touren_id !== null)
        .map((j) => j.touren_id),
    }
  }

  const parsedFields = fields ? fields.split(',') : ['*', '*.*']
  return await directus.request(readItem(collection, id, { fields: parsedFields }))
})
