<script setup lang="ts">
const tours = [
  {
    title: 'Königssee-Rundweg',
    region: 'Berchtesgadener Alpen',
    difficulty: 'leicht' as const,
    distance: '14 km',
    ascent: '420 hm',
    duration: '5 Std.',
    variant: 'alpine-see' as const,
  },
  {
    title: 'Drei-Zinnen-Umrundung',
    region: 'Dolomiten, Südtirol',
    difficulty: 'mittel' as const,
    distance: '10 km',
    ascent: '380 hm',
    duration: '4 Std.',
    variant: 'hochgebirge' as const,
  },
  {
    title: 'Watzmann-Überschreitung',
    region: 'Bayerische Alpen',
    difficulty: 'schwer' as const,
    distance: '22 km',
    ascent: '2.100 hm',
    duration: '2 Tage',
    variant: 'almwiese' as const,
  },
]
</script>

<template>
  <section id="touren" class="bg-muted/40 py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <span class="text-xs font-medium uppercase tracking-widest text-primary">
          Beliebte Touren
        </span>
        <h2 class="mt-3 font-heading text-f-5xl font-medium tracking-tight text-foreground">
          Wanderungen, die man nicht vergisst
        </h2>
        <p class="mt-4 text-f-lg text-muted-foreground">
          Eine Auswahl unserer beliebtesten Routen — von der entspannten Tagestour
          bis zur mehrtägigen Gipfelbesteigung.
        </p>
      </div>

      <div class="mt-f-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <TourCard v-for="tour in tours" :key="tour.title" v-bind="tour" />
      </div>

      <div class="mt-f-12 text-center">
        <Button variant="ghost" class="text-primary hover:bg-primary/5">
          Alle 240 Touren ansehen
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  </section>
</template>
