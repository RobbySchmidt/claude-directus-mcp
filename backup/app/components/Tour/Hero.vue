<script setup lang="ts">
import type { TourDifficulty, TourVariant } from '~~/shared/types/touren'

defineProps<{
  title: string
  subtitle: string | null
  region: string
  difficulty: TourDifficulty
  variant: TourVariant
  bookingUrl: string | null
}>()

const difficultyColor: Record<TourDifficulty, string> = {
  leicht: 'bg-primary/10 text-primary',
  mittel: 'bg-accent/20 text-accent-foreground',
  schwer: 'bg-destructive/15 text-destructive',
}
</script>

<template>
  <section class="relative overflow-hidden bg-linear-to-b from-secondary/20 to-background">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-f-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
      <div class="relative aspect-4/3 overflow-hidden rounded-3xl bg-muted shadow-lg">
        <IllustrationsTourIllustration :variant="variant" />
      </div>
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {{ region }}
          </span>
          <span
            class="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider"
            :class="difficultyColor[difficulty]"
          >
            {{ difficulty }}
          </span>
        </div>
        <h1 class="mt-5 font-heading text-f-6xl font-medium tracking-tight text-foreground">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mt-4 text-f-xl text-muted-foreground">
          {{ subtitle }}
        </p>
        <div class="mt-8">
          <a
            v-if="bookingUrl"
            :href="bookingUrl"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {{ $t('booking.book_now') }}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          </a>
          <button
            v-else
            type="button"
            disabled
            class="inline-flex items-center justify-center gap-2 rounded-full bg-muted px-6 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed"
          >
            {{ $t('booking.book_soon') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
