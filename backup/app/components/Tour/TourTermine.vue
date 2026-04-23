<script setup lang="ts">
import type { TerminPublic } from '~~/shared/types/buchung'

defineProps<{
  termine: TerminPublic[]
  tourSlug: string
  priceFrom: number | null
}>()

const localePath = useLocalePath()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function terminPreis(t: TerminPublic, priceFrom: number | null) {
  return t.price_override ?? priceFrom ?? 0
}
</script>

<template>
  <section class="my-f-12">
    <h2 class="font-heading text-f-2xl font-medium text-foreground">{{ $t('tour.next_dates') }}</h2>
    <p v-if="!termine.length" class="mt-3 text-muted-foreground">
      {{ $t('tour.no_fixed_dates') }}
    </p>
    <ul v-else class="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
      <li
        v-for="t in termine"
        :key="t.id"
        class="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div class="font-medium text-foreground">
            {{ formatDatum(t.date_from) }} – {{ formatDatum(t.date_to) }}
          </div>
          <p v-if="t.hinweis" class="mt-1 text-sm text-muted-foreground">{{ t.hinweis }}</p>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">{{ $t('tour.price_from', { price: terminPreis(t, priceFrom) }) }}</span>
          <span
            v-if="t.verfuegbare_plaetze === -1"
            class="rounded-full border border-border px-2 py-0.5 text-xs"
          >
            {{ $t('booking.places_left', { count: '∞' }) }}
          </span>
          <span
            v-else-if="t.ausgebucht"
            class="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-900"
          >
            {{ $t('booking.sold_out') }}
          </span>
          <span
            v-else
            class="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs text-green-900"
          >
            {{ $t('booking.places_left', { count: t.verfuegbare_plaetze }) }}
          </span>
        </div>
      </li>
    </ul>
    <NuxtLink
      :to="localePath({ name: 'touren-slug-buchen', params: { slug: tourSlug } })"
      class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
    >
      {{ $t('booking.book_now') }}
    </NuxtLink>
  </section>
</template>
