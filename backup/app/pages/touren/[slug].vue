<script setup lang="ts">
import type { TourDetail } from '~~/shared/types/touren'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: tour, error } = await useAsyncData(
  () => `tour-${slug.value}`,
  () => $fetch<TourDetail>('/api/content/tour', { query: { slug: slug.value } }),
  { watch: [slug] },
)

if (error.value || !tour.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: error.value?.statusMessage ?? `Tour "${slug.value}" nicht gefunden`,
    fatal: true,
  })
}

const { public: pub } = useRuntimeConfig()

useSeoMeta({
  title: () => `${tour.value!.title} | ${pub.siteName}`,
  description: () => tour.value!.subtitle ?? tour.value!.intro ?? tour.value!.title,
  ogTitle: () => tour.value!.title,
  ogDescription: () => tour.value!.subtitle ?? tour.value!.intro ?? tour.value!.title,
  ogUrl: () => `${pub.siteUrl}/touren/${tour.value!.slug}`,
})
</script>

<template>
  <div v-if="tour" class="min-h-screen bg-background text-foreground antialiased pb-24 md:pb-0">
    <SectionsTheHeader />
    <main class="pt-20">
      <nav aria-label="Breadcrumb" class="mx-auto max-w-7xl px-4 pt-f-8 sm:px-6 lg:px-8">
        <ol class="flex flex-wrap items-center gap-1.5 text-sm">
          <li>
            <NuxtLink to="/" class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
              </svg>
              Home
            </NuxtLink>
          </li>
          <li aria-hidden="true" class="text-muted-foreground/40">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <NuxtLink to="/#touren" class="inline-flex items-center rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Touren
            </NuxtLink>
          </li>
          <li aria-hidden="true" class="text-muted-foreground/40">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li class="px-2 py-1 font-medium text-foreground" aria-current="page">
            {{ tour.title }}
          </li>
        </ol>
      </nav>

      <TourHero
        :title="tour.title"
        :subtitle="tour.subtitle"
        :region="tour.region"
        :difficulty="tour.difficulty"
        :variant="tour.variant"
        :booking-url="tour.booking_url"
      />
      <TourFactsBar
        :distance="tour.distance"
        :ascent="tour.ascent"
        :duration="tour.duration"
        :group-size-max="tour.group_size_max"
      />
      <TourHighlights :intro="tour.intro" :items="tour.highlights" />
      <TourGallery :images="tour.gallery" :tour-title="tour.title" />
      <TourIncluded :included="tour.included" :not-included="tour.not_included" />
      <TourOrganizational
        :meeting-point="tour.meeting_point"
        :season="tour.season"
        :price-from="tour.price_from"
      />
      <TourCTA :booking-url="tour.booking_url" :title="tour.title" />
    </main>
    <SectionsTheFooter />
    <TourStickyMobileCTA :booking-url="tour.booking_url" :price-from="tour.price_from" />
  </div>
</template>
