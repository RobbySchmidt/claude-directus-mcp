<script setup lang="ts">
import type { PageContent } from '~~/shared/types/content'

const { public: pub } = useRuntimeConfig()
const route = useRoute()

const slug = computed(() => {
  if (route.path === '/') return 'home'
  const parts = route.params.slug
  return Array.isArray(parts) ? parts[0] : parts
})

const { data: page, error } = await useAsyncData(() => route.path, () =>
  $fetch<PageContent>('/api/content/page', { query: { slug: slug.value } }),
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? 'Page Not Found',
  })
}

useSeoMeta({
  title: () => page.value?.seo?.title ?? pub.siteName,
  description: () => page.value?.seo?.meta_description ?? pub.siteName,
  ogTitle: () => page.value?.seo?.title ?? pub.siteName,
  ogDescription: () => page.value?.seo?.meta_description ?? pub.siteName,
  ogUrl: () => pub.siteUrl + route.path,
  robots: () => {
    if (!page.value?.seo) return 'noindex, nofollow'
    const { no_index, no_follow } = page.value.seo
    return `${no_index ? 'noindex' : 'index'}, ${no_follow ? 'nofollow' : 'follow'}`
  },
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main>
      <WebsiteContentBlockBuilder v-if="page?.blocks?.length" :blocks="page.blocks" />
    </main>
    <SectionsTheFooter />
  </div>
</template>
