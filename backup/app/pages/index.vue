<script setup lang="ts">
import type { PageContent } from '~~/shared/types/content'

const { public: pub } = useRuntimeConfig()
const { locale, t } = useI18n()

const { data: page, error } = await useAsyncData('homepage', () =>
  $fetch<PageContent>('/api/content/homepage', { query: { locale: locale.value } }),
)

if (error.value && error.value.statusCode !== 404) throw error.value

useSeoMeta({
  title: () => page.value?.seo?.title ?? pub.siteName,
  description: () => page.value?.seo?.meta_description ?? pub.siteName,
  ogTitle: () => page.value?.seo?.title ?? pub.siteName,
  ogDescription: () => page.value?.seo?.meta_description ?? pub.siteName,
  ogUrl: () => pub.siteUrl,
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
      <template v-if="page?.blocks?.length">
        <WebsiteContentBlockBuilder :blocks="page.blocks" />
      </template>
      <template v-else-if="error?.statusCode === 404">
        <div class="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 class="font-heading text-4xl">{{ $t('common.not_found_title') }}</h1>
          <p class="mt-4 text-muted-foreground">{{ $t('common.not_found_lead') }}</p>
        </div>
      </template>
    </main>
    <SectionsTheFooter />
  </div>
</template>
