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
    <main>
      <nav aria-label="Breadcrumb" class="mx-auto max-w-7xl px-4 pt-f-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <ol class="flex items-center gap-2">
          <li><NuxtLink to="/" class="hover:text-foreground">Home</NuxtLink></li>
          <li aria-hidden="true">/</li>
          <li><NuxtLink to="/#touren" class="hover:text-foreground">Touren</NuxtLink></li>
          <li aria-hidden="true">/</li>
          <li class="text-foreground">{{ tour.title }}</li>
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
