import { readItem } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'
import { toDirectusLocale } from '~~/server/utils/i18n'

type BlockConfig = {
  fields: string[]
  hasTranslation: boolean
  itemsAliasField?: string
  itemsCollection?: string
}

const BLOCK_CONFIG: Record<string, BlockConfig> = {
  block_heroBanner: {
    fields: ['*', 'image_sky.*', 'image_back.*', 'image_mid.*', 'image_front.*', 'translations.*', 'trust_signals.*', 'trust_signals.translations.*'],
    hasTranslation: true,
    itemsAliasField: 'trust_signals',
    itemsCollection: 'block_heroBanner_trust_signals',
  },
  block_statsBand: {
    fields: ['*', 'items.*', 'items.translations.*'],
    hasTranslation: false,
    itemsAliasField: 'items',
    itemsCollection: 'block_statsBand_items',
  },
  block_tourGrid: {
    fields: ['*', 'translations.*', 'tours.touren_id.*', 'tours.touren_id.translations.*'],
    hasTranslation: true,
  },
  block_benefits: {
    fields: ['*', 'translations.*', 'items.*', 'items.translations.*'],
    hasTranslation: true,
    itemsAliasField: 'items',
    itemsCollection: 'block_benefits_items',
  },
  block_regionList: {
    fields: ['*', 'image.*', 'translations.*', 'regions.*', 'regions.translations.*'],
    hasTranslation: true,
    itemsAliasField: 'regions',
    itemsCollection: 'block_regionList_regions',
  },
  block_testimonials: {
    fields: ['*', 'translations.*', 'items.*', 'items.tour.id', 'items.tour.translations.*', 'items.translations.*'],
    hasTranslation: true,
    itemsAliasField: 'items',
    itemsCollection: 'block_testimonials_items',
  },
  block_newsletter: { fields: ['*', 'translations.*'], hasTranslation: true },
  block_carousel: { fields: ['*', 'images.directus_files_id.*', 'translations.*'], hasTranslation: true },
  block_imageText: {
    fields: ['*', 'image.*', 'translations.*', 'buttons.*', 'buttons.translations.*'],
    hasTranslation: true,
    itemsAliasField: 'buttons',
    itemsCollection: 'block_imageText_buttons',
  },
  block_text: { fields: ['*', 'translations.*'], hasTranslation: true },
  block_banner: {
    fields: ['*', 'translations.*', 'buttons.*', 'buttons.translations.*'],
    hasTranslation: true,
    itemsAliasField: 'buttons',
    itemsCollection: 'block_banner_buttons',
  },
  block_reception: { fields: ['*'], hasTranslation: false },
}

function flattenTranslation<T extends { translations?: Array<Record<string, any>> }>(obj: T): Record<string, any> {
  const t = (obj as any).translations?.[0] ?? {}
  const { translations: _drop, ...rest } = obj as any
  return { ...rest, ...t }
}

function flattenItems(items: Array<Record<string, any>> | undefined): Array<Record<string, any>> {
  if (!items) return []
  return items
    .map((i) => flattenTranslation(i as any))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const collection = query.collection as string
  const id = query.id as string
  const locale = toDirectusLocale(query.locale)

  if (!collection || !BLOCK_CONFIG[collection]) {
    throw createError({ statusCode: 400, statusMessage: 'invalid collection' })
  }
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const cfg = BLOCK_CONFIG[collection]

  const deep: Record<string, any> = {}
  if (cfg.hasTranslation) {
    deep.translations = { _filter: { languages_code: { _eq: locale } }, _limit: 1 }
  }
  if (cfg.itemsAliasField) {
    deep[cfg.itemsAliasField] = {
      translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 },
    }
  }
  if (collection === 'block_tourGrid') {
    deep.tours = { touren_id: { translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 } } }
  }
  if (collection === 'block_testimonials') {
    deep.items = {
      ...(deep.items ?? {}),
      translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 },
      tour: { translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 } },
    }
  }

  const directus = useDirectusServer()

  const block = await directus.request(readItem(collection, id, {
    fields: cfg.fields as any,
    deep: deep as any,
  }))

  if (!block) throw createError({ statusCode: 404, statusMessage: 'Block not found' })

  if (cfg.hasTranslation && !(block as any).translations?.[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Block translation missing' })
  }

  const flat = cfg.hasTranslation ? flattenTranslation(block as any) : { ...(block as any) }

  if (cfg.itemsAliasField) {
    flat[cfg.itemsAliasField] = flattenItems((block as any)[cfg.itemsAliasField])
  }

  // Testimonials: flatten tour-relation with translated title/slug; drop raw tour object
  if (collection === 'block_testimonials' && flat.items) {
    flat.items = flat.items.map((it: any) => {
      const tourTitle = it.tour?.translations?.[0]?.title ?? it.tour_fallback ?? null
      const tourSlug = it.tour?.translations?.[0]?.slug ?? null
      return { ...it, tour: null, tour_title: tourTitle, tour_slug: tourSlug }
    })
  }

  // tourGrid: flatten nested touren translations up
  if (collection === 'block_tourGrid' && (flat as any).tours) {
    (flat as any).tours = (flat as any).tours
      .map((t: any) => {
        const tour = t.touren_id
        if (!tour?.translations?.[0]) return null
        const { translations, ...rest } = tour
        return { ...rest, ...translations[0] }
      })
      .filter(Boolean)
  }

  return flat
})
