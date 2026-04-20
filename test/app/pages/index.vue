<script setup lang="ts">
useHead({
  title: 'Alpenpfad — Geführte Wanderungen in den Alpen',
  meta: [
    {
      name: 'description',
      content:
        'Geführte Wanderungen durch die schönsten Regionen der Alpen. Zertifizierte Guides, kleine Gruppen, nachhaltig organisiert.',
    },
  ],
  htmlAttrs: { lang: 'de' },
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main>
      <SectionsSectionHero />
      <SectionsSectionStats />
      <SectionsSectionTours />
      <SectionsSectionBenefits />
      <SectionsSectionRegions />
      <SectionsSectionTestimonials />
      <SectionsSectionNewsletter />
    </main>
    <SectionsTheFooter />
  </div>
</template>
