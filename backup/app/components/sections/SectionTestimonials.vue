<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string | null
  headline?: string | null
  items?: Array<{ quote: string; name: string; tour: string; initials: string }> | null
}>(), {
  eyebrow: null,
  headline: null,
  items: null,
})
</script>

<template>
  <section id="stimmen" class="bg-muted/40 py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <span class="text-xs font-medium uppercase tracking-widest text-primary">{{ eyebrow }}</span>
        <h2 class="mt-3 font-heading text-f-5xl font-medium tracking-tight text-foreground">
          {{ headline }}
        </h2>
      </div>

      <div class="mt-f-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TestimonialCard v-for="t in items" :key="t.name" v-bind="t" />
      </div>
    </div>
  </section>
</template>
