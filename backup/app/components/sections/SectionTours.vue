<script setup lang="ts">
withDefaults(defineProps<{
  tours?: Array<{
    slug: string
    title: string
    region: string
    difficulty: 'leicht' | 'mittel' | 'schwer'
    distance: string
    ascent: string
    duration: string
    variant: string
  }> | null
  eyebrow?: string | null
  headline?: string | null
  lead?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
}>(), {
  tours: null,
  eyebrow: null,
  headline: null,
  lead: null,
  ctaLabel: null,
  ctaHref: null,
})
</script>

<template>
  <section id="touren" class="bg-muted/40 py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <span class="text-xs font-medium uppercase tracking-widest text-primary">
          {{ eyebrow }}
        </span>
        <h2 class="mt-3 font-heading text-f-5xl font-medium tracking-tight text-foreground">
          {{ headline }}
        </h2>
        <p class="mt-4 text-f-lg text-muted-foreground">
          {{ lead }}
        </p>
      </div>

      <div class="mt-f-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <TourCard v-for="tour in tours" :key="tour.title" v-bind="tour" />
      </div>

      <div class="mt-f-12 text-center">
        <Button
          variant="ghost"
          class="text-primary hover:bg-primary/5"
          :as="ctaHref ? 'a' : 'button'"
          v-bind="ctaHref ? { href: ctaHref } : {}"
        >
          {{ ctaLabel ?? $t('cta.discover_tours') }}
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  </section>
</template>
