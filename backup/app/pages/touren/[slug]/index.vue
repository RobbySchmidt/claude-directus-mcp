<script setup lang="ts">
import type { TourDetail } from '~~/shared/types/touren'
import { setAlternateLocales } from '~/composables/useAlternateLocales'

defineI18nRoute({
  paths: {
    de: '/touren/[slug]',
    en: '/tours/[slug]',
  },
})

const route = useRoute()
const { locale } = useI18n()
const localePath = useLocalePath()
const slug = computed(() => String(route.params.slug))

const { data: tour, error } = await useAsyncData(
  () => `tour-${slug.value}-${locale.value}`,
  () => $fetch<TourDetail>('/api/content/tour', { query: { slug: slug.value, locale: locale.value } }),
  { watch: [slug, locale] },
)

if (error.value || !tour.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: error.value?.statusMessage ?? `Tour "${slug.value}" nicht gefunden`,
    fatal: true,
  })
}

watchEffect(() => {
  setAlternateLocales(tour.value?.alternate_locales ?? null)
})
onBeforeUnmount(() => setAlternateLocales(null))

// Tell i18n which slug belongs to which locale so the language switcher
// and hreflang tags point to the correct per-locale URL instead of reusing
// the current locale's slug across all languages.
const setI18nParams = useSetI18nParams()
watchEffect(() => {
  const alt = tour.value?.alternate_locales
  if (!alt) return
  setI18nParams({
    de: { slug: alt['de-DE'] ?? '' },
    en: { slug: alt['en-US'] ?? '' },
  })
})

const { public: pub } = useRuntimeConfig()

const buchenHref = computed(() => (tour.value ? localePath(`/touren/${tour.value.slug}/buchen`) : ''))

useSeoMeta({
  title: () => `${tour.value!.title} | ${pub.siteName}`,
  description: () => tour.value!.subtitle ?? tour.value!.intro ?? tour.value!.title,
  ogTitle: () => tour.value!.title,
  ogDescription: () => tour.value!.subtitle ?? tour.value!.intro ?? tour.value!.title,
  ogUrl: () => `${pub.siteUrl}/touren/${tour.value!.slug}`,
})
</script>

<template>
  <template v-if="tour">
    <TourHero
      :title="tour.title"
      :subtitle="tour.subtitle"
      :region="tour.region"
      :difficulty="tour.difficulty"
      :variant="tour.variant"
      :booking-url="buchenHref"
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
    <section class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <TourTermine
        :termine="tour.termine"
        :tour-slug="tour.slug"
        :price-from="tour.price_from"
      />
    </section>
    <TourCTA :booking-url="buchenHref" :title="tour.title" />
    <TourStickyMobileCTA :booking-url="buchenHref" :price-from="tour.price_from" />
  </template>
</template>
