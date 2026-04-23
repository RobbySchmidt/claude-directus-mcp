<script setup lang="ts">
import type { TourCardData } from '~~/shared/types/touren'

type TourGridBlock = {
  eyebrow: string | null
  headline: string | null
  lead: string | null
  cta_label: string | null
  cta_href: string | null
  tours: TourCardData[] | null
}

const props = defineProps<{ id: string; collection: string; index: number }>()
const { locale } = useI18n()

const { data: block } = await useAsyncData(
  `block-${props.collection}-${props.id}-${locale.value}`,
  () => $fetch<TourGridBlock>('/api/content/block', {
    query: { collection: props.collection, id: props.id, locale: locale.value },
  }),
  { watch: [locale] },
)
</script>

<template>
  <section v-if="block" id="touren" class="bg-muted/40 py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <span v-if="block.eyebrow" class="text-xs font-medium uppercase tracking-widest text-primary">
          {{ block.eyebrow }}
        </span>
        <h2 v-if="block.headline" class="mt-3 font-heading text-f-5xl font-medium tracking-tight text-foreground">
          {{ block.headline }}
        </h2>
        <p v-if="block.lead" class="mt-4 text-f-lg text-muted-foreground">{{ block.lead }}</p>
      </div>

      <div v-if="block.tours?.length" class="mt-f-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <TourCard
          v-for="tour in block.tours"
          :key="tour.id"
          :slug="tour.slug"
          :title="tour.title"
          :region="tour.region"
          :difficulty="tour.difficulty"
          :variant="tour.variant"
          :distance="tour.distance"
          :ascent="tour.ascent"
          :duration="tour.duration"
        />
      </div>

      <div v-if="block.cta_label" class="mt-f-12 text-center">
        <Button
          variant="ghost"
          class="text-primary hover:bg-primary/5"
          :as="block.cta_href ? 'a' : 'button'"
          :href="block.cta_href ?? undefined"
        >
          {{ block.cta_label }}
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  </section>
</template>
