<script setup lang="ts">
defineProps<{
  bookingUrl: string | null
  title: string
}>()
</script>

<template>
  <section class="bg-primary/5">
    <div class="mx-auto max-w-7xl px-4 py-f-20 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <h2 class="font-heading text-f-4xl font-medium text-foreground">
          Bereit für {{ title }}?
        </h2>
        <p class="text-f-lg text-muted-foreground">
          Sichere dir einen der begrenzten Plätze und starte in ein Abenteuer, das bleibt.
        </p>
        <div class="flex flex-col gap-3 sm:flex-row">
          <a
            v-if="bookingUrl"
            :href="bookingUrl"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Jetzt buchen
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          </a>
          <button
            v-else
            type="button"
            disabled
            class="inline-flex items-center justify-center gap-2 rounded-full bg-muted px-7 py-3.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
          >
            Buchung in Kürze
          </button>
          <NuxtLink
            to="/#touren"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Zurück zur Übersicht
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
