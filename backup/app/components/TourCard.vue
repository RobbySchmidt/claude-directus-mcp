<script setup lang="ts">
defineProps<{
  slug: string
  title: string
  region: string
  difficulty: 'leicht' | 'mittel' | 'schwer'
  distance: string
  ascent: string
  duration: string
  variant: 'alpine-see' | 'hochgebirge' | 'almwiese'
}>()

const difficultyColor = {
  leicht: 'bg-primary/10 text-primary',
  mittel: 'bg-accent/20 text-accent-foreground',
  schwer: 'bg-destructive/15 text-destructive',
}
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
  >
    <div class="relative aspect-4/3 overflow-hidden bg-muted">
      <IllustrationsTourIllustration :variant="variant" class="transition-transform duration-500 group-hover:scale-105" />
      <span
        class="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur-sm"
        :class="difficultyColor[difficulty]"
      >
        {{ difficulty }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-4 p-6">
      <div>
        <p class="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {{ region }}
        </p>
        <h3 class="mt-1 font-heading text-f-2xl font-medium text-foreground">
          {{ title }}
        </h3>
      </div>

      <dl class="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
        <div>
          <dt class="text-xs text-muted-foreground">Strecke</dt>
          <dd class="mt-0.5 text-sm font-semibold text-foreground">{{ distance }}</dd>
        </div>
        <div class="border-x border-border">
          <dt class="text-xs text-muted-foreground">Aufstieg</dt>
          <dd class="mt-0.5 text-sm font-semibold text-foreground">{{ ascent }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">Dauer</dt>
          <dd class="mt-0.5 text-sm font-semibold text-foreground">{{ duration }}</dd>
        </div>
      </dl>

      <NuxtLink
        :to="`/touren/${slug}`"
        class="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Tour ansehen
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 12h14" />
        </svg>
      </NuxtLink>
    </div>
  </article>
</template>
