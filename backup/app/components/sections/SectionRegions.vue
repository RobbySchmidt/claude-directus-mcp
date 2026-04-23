<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string | null
  headline?: string | null
  lead?: string | null
  ctaLabel?: string | null
  regions?: Array<{ name: string; tours: number }> | null
}>(), {
  eyebrow: null,
  headline: null,
  lead: null,
  ctaLabel: null,
  regions: null,
})
</script>

<template>
  <section id="regionen" class="relative overflow-hidden bg-primary py-f-24 text-primary-foreground">
    <div class="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <span class="text-xs font-medium uppercase tracking-widest text-accent">
          {{ eyebrow }}
        </span>
        <h2 class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight">
          {{ headline }}
        </h2>
        <p class="mt-5 text-f-lg leading-relaxed text-primary-foreground/85">
          {{ lead }}
        </p>

        <ul class="mt-8 grid grid-cols-2 gap-x-8 gap-y-3">
          <li
            v-for="region in regions"
            :key="region.name"
            class="flex items-center justify-between border-b border-primary-foreground/15 pb-3"
          >
            <span class="font-medium">{{ region.name }}</span>
            <span class="text-sm text-primary-foreground/60">{{ region.tours }}</span>
          </li>
        </ul>

        <Button size="lg" class="mt-10 h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90">
          {{ ctaLabel ?? $t('cta.discover_tours') }}
        </Button>
      </div>

      <div class="relative overflow-hidden rounded-3xl shadow-2xl">
        <IllustrationsMountainPanorama />
      </div>
    </div>
  </section>
</template>
