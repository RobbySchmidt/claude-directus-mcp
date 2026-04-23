<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string | null
  headline?: string | null
  lead?: string | null
  items?: Array<{ title: string; description: string; icon: string }> | null
}>(), {
  eyebrow: null,
  headline: null,
  lead: null,
  items: null,
})
</script>

<template>
  <section id="benefits" class="bg-background py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid items-start gap-12 lg:grid-cols-[1fr_2fr]">
        <div class="lg:sticky lg:top-28">
          <span class="text-xs font-medium uppercase tracking-widest text-primary">
            {{ eyebrow }}
          </span>
          <h2 class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight text-foreground">
            {{ headline }}
          </h2>
          <p class="mt-5 text-f-lg leading-relaxed text-muted-foreground">
            {{ lead }}
          </p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <BenefitCard v-for="b in items" :key="b.title" v-bind="b" />
        </div>
      </div>
    </div>
  </section>
</template>
