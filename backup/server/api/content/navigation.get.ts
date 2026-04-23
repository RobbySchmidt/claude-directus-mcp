import { readItems } from '@directus/sdk'
import { useDirectusServer } from '~~/server/utils/directus'
import { toDirectusLocale } from '~~/server/utils/i18n'

type NavItem = {
  id: number
  sort: number | null
  type: string
  url: string | null
  open_in_new_tab: boolean
  parent: number | null
  title: string
  href: string
  children: NavItem[]
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = toDirectusLocale(query.locale)

  const directus = useDirectusServer()

  const items = await directus.request(readItems('navigation_items', {
    limit: -1,
    fields: [
      'id', 'sort', 'type', 'url', 'open_in_new_tab', 'parent', 'navigation',
      'page.id', 'page.translations.slug',
      'translations.title',
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deep: {
      translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 },
      page: { translations: { _filter: { languages_code: { _eq: locale } }, _limit: 1 } },
    } as any,
    sort: ['sort'],
  }))

  const navs = await directus.request(readItems('navigation', {
    limit: -1, fields: ['id', 'title', 'isLastMenuItemHighlighted'],
  }))
  const navById: Record<number, { title: string; isLastMenuItemHighlighted: boolean }> = {}
  for (const n of navs as any[]) {
    navById[n.id] = { title: n.title, isLastMenuItemHighlighted: !!n.isLastMenuItemHighlighted }
  }

  const byId = new Map<number, any>()
  for (const raw of items as any[]) {
    const title = raw.translations?.[0]?.title ?? ''
    const pageSlug = raw.page?.translations?.[0]?.slug ?? null
    const href = raw.type === 'page'
      ? (pageSlug ? `/${pageSlug}` : '#')
      : (raw.url ?? '#')
    byId.set(raw.id, {
      id: raw.id, sort: raw.sort, type: raw.type, url: raw.url, page: null,
      open_in_new_tab: raw.open_in_new_tab, parent: raw.parent,
      title, href, navigation: raw.navigation, children: [],
    })
  }

  const byNav: Record<string, NavItem[]> = {}
  for (const item of byId.values()) {
    const navName = navById[item.navigation]?.title
    if (!navName) continue
    if (item.parent) {
      const parent = byId.get(item.parent)
      if (parent) parent.children.push(item)
    } else {
      if (!byNav[navName]) byNav[navName] = []
      byNav[navName].push(item)
    }
  }
  for (const list of Object.values(byNav)) list.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  for (const list of Object.values(byNav)) {
    for (const p of list) p.children.sort((a: NavItem, b: NavItem) => (a.sort ?? 0) - (b.sort ?? 0))
  }

  return byNav
})
