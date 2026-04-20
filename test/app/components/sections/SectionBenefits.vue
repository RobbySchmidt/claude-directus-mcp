<script setup lang="ts">
const benefits = [
  {
    title: 'Zertifizierte Guides',
    description: 'Alle Bergführer sind geprüft nach UIAGM-Standard und kennen ihre Region wie die eigene Westentasche.',
    icon: 'compass' as const,
  },
  {
    title: 'Kleine Gruppen',
    description: 'Maximal 8 Teilnehmer pro Tour — für echte Natur-Erlebnisse statt Massentourismus auf schmalen Graten.',
    icon: 'trail' as const,
  },
  {
    title: 'Alle Schwierigkeitsgrade',
    description: 'Vom gemütlichen Panoramaweg bis zur Zweitagestour mit Übernachtung auf der Hütte — wir passen zu deinem Level.',
    icon: 'boot' as const,
  },
  {
    title: 'Nachhaltig & lokal',
    description: 'Unterkünfte bei lokalen Hüttenwirten, öffentliche An- und Abreise inklusive, CO₂-Ausgleich pro Tour.',
    icon: 'tree' as const,
  },
]
</script>

<template>
  <section id="benefits" class="bg-background py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid items-start gap-12 lg:grid-cols-[1fr_2fr]">
        <div class="lg:sticky lg:top-28">
          <span class="text-xs font-medium uppercase tracking-widest text-primary">
            Warum Alpenpfad
          </span>
          <h2 class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight text-foreground">
            Bergerlebnisse, die wirklich gut gemacht sind.
          </h2>
          <p class="mt-5 text-f-lg leading-relaxed text-muted-foreground">
            Wir organisieren seit über zehn Jahren Wanderungen in den Alpen — und wir wissen,
            worauf es ankommt: fachliche Sicherheit, echte Naturmomente und Organisation,
            die einfach funktioniert.
          </p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <BenefitCard v-for="b in benefits" :key="b.title" v-bind="b" />
        </div>
      </div>
    </div>
  </section>
</template>
