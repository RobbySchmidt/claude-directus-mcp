<script setup lang="ts">
const testimonials = [
  {
    quote: 'Wir dachten, wir kennen die Alpen. Nach drei Tagen mit Lukas als Guide wussten wir: wir haben bisher nur an der Oberfläche gekratzt.',
    name: 'Marianne Berger',
    tour: 'Drei-Zinnen-Umrundung',
    initials: 'MB',
  },
  {
    quote: 'Perfekt organisiert vom ersten Mail bis zur Heimfahrt. Die Hütte war urig, die Gruppe klein und sympathisch — genau, was wir wollten.',
    name: 'Jonas Fellner',
    tour: 'Watzmann-Überschreitung',
    initials: 'JF',
  },
  {
    quote: 'Als Einsteigerin hatte ich Respekt. Aber unsere Guide Anne hat das Tempo perfekt abgestimmt. Ich komme wieder — nur nächstes Mal etwas höher.',
    name: 'Sophia Kraus',
    tour: 'Königssee-Rundweg',
    initials: 'SK',
  },
]
</script>

<template>
  <section id="stimmen" class="bg-muted/40 py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <span class="text-xs font-medium uppercase tracking-widest text-primary">Stimmen</span>
        <h2 class="mt-3 font-heading text-f-5xl font-medium tracking-tight text-foreground">
          Was unsere Wanderer erzählen
        </h2>
      </div>

      <div class="mt-f-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TestimonialCard v-for="t in testimonials" :key="t.name" v-bind="t" />
      </div>
    </div>
  </section>
</template>
