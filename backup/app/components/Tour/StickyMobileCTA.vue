<script setup lang="ts">
defineProps<{
  bookingUrl: string | null
  priceFrom: number | null
}>()

const priceText = (v: number | null) =>
  v === null ? null : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur md:hidden"
    style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <div v-if="priceFrom !== null" class="flex flex-col">
        <span class="text-xs text-muted-foreground">ab</span>
        <span class="font-heading text-f-lg font-medium text-foreground">{{ priceText(priceFrom) }}</span>
      </div>
      <a
        v-if="bookingUrl"
        :href="bookingUrl"
        class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Jetzt buchen
      </a>
      <button
        v-else
        type="button"
        disabled
        class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-muted px-5 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed"
      >
        Buchung in Kürze
      </button>
    </div>
  </div>
</template>
