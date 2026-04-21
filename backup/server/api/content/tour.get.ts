import { readItems } from '@directus/sdk'
import type { TourDetail, TourGalleryImage } from '~~/shared/types/touren'
import { useDirectusServer } from '~~/server/utils/directus'

const TOUR_FIELDS = [
  'id',
  'slug',
  'title',
  'subtitle',
  'region',
  'difficulty',
  'variant',
  'distance',
  'ascent',
  'duration',
  'group_size_max',
  'intro',
  'highlights',
  'included',
  'not_included',
  'meeting_point',
  'season',
  'price_from',
  'booking_url',
  'gallery.directus_files_id.id',
  'gallery.directus_files_id.title',
  'gallery.directus_files_id.filename_disk',
  'gallery.sort',
]

export default defineEventHandler(async (event): Promise<TourDetail> => {
  const { slug } = getQuery(event) as { slug?: string }
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug required' })
  }

  const directus = useDirectusServer()
  const [item] = (await directus.request(
    readItems('touren', {
      filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
      limit: 1,
      fields: TOUR_FIELDS,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deep: { gallery: { _sort: ['sort'] } } as any,
    }),
  )) as Array<{
    id: string
    slug: string
    title: string
    subtitle: string | null
    region: string
    difficulty: 'leicht' | 'mittel' | 'schwer'
    variant: 'alpine-see' | 'hochgebirge' | 'almwiese'
    distance: string
    ascent: string
    duration: string
    group_size_max: number | null
    intro: string | null
    highlights: string[] | null
    included: string[] | null
    not_included: string[] | null
    meeting_point: string | null
    season: string | null
    price_from: number | null
    booking_url: string | null
    gallery: Array<{ directus_files_id: TourGalleryImage | null; sort: number | null }> | null
  }>

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: `Tour "${slug}" nicht gefunden` })
  }

  return {
    ...item,
    gallery: (item.gallery ?? [])
      .map((g) => g.directus_files_id)
      .filter((f): f is TourGalleryImage => f !== null),
  }
})
