export type Seo = {
  title: string | null
  meta_description: string | null
  canonical_url: string | null
  no_index: boolean | null
  no_follow: boolean | null
}

export type PageBlockRef = {
  collection: string
  item: string
  sort: number | null
}

export type PageContent = {
  id: number
  slug: string
  title: string | null
  status: string
  seo: Seo | null
  blocks: PageBlockRef[]
}
