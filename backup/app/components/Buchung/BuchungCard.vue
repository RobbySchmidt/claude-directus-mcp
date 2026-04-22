<script setup lang="ts">
import type { BuchungListItem } from '~~/shared/types/buchung'

defineProps<{ buchung: BuchungListItem }>()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
</script>

<template>
  <NuxtLink
    :to="`/konto/buchungen/${buchung.id}`"
    class="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <div class="flex items-center gap-2">
        <span class="font-heading text-lg font-medium text-foreground">{{ buchung.tour.title }}</span>
        <BuchungStatusBadge :status="buchung.status" />
      </div>
      <p class="mt-1 text-sm text-muted-foreground">
        <template v-if="buchung.termin">
          {{ formatDatum(buchung.termin.date_from) }} – {{ formatDatum(buchung.termin.date_to) }}
        </template>
        <template v-else-if="buchung.wunsch_datum">
          Wunschdatum: {{ formatDatum(buchung.wunsch_datum) }}
        </template>
      </p>
    </div>
    <div class="text-right">
      <div class="text-sm text-muted-foreground">{{ buchung.personen_anzahl }} Pers.</div>
      <div class="font-heading text-lg text-foreground">{{ buchung.preis_gesamt }} EUR</div>
    </div>
  </NuxtLink>
</template>
