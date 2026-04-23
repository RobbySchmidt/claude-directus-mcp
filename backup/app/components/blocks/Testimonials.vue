<script setup lang="ts">
type Testimonial = { quote: string; name: string; tour: string; initials: string }
type TestimonialsBlock = {
  eyebrow: string | null
  headline: string | null
  items: Testimonial[] | null
}

const props = defineProps<{ id: string; collection: string; index: number }>()
const { locale } = useI18n()

const { data: block } = await useAsyncData(
  `block-${props.collection}-${props.id}-${locale.value}`,
  () => $fetch<TestimonialsBlock>('/api/content/block', {
    query: { collection: props.collection, id: props.id, locale: locale.value },
  }),
  { watch: [locale] },
)
</script>

<template>
  <section v-if="block" id="stimmen" class="bg-muted/40 py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <span v-if="block.eyebrow" class="text-xs font-medium uppercase tracking-widest text-primary">
          {{ block.eyebrow }}
        </span>
        <h2 v-if="block.headline" class="mt-3 font-heading text-f-5xl font-medium tracking-tight text-foreground">
          {{ block.headline }}
        </h2>
      </div>

      <div v-if="block.items?.length" class="mt-f-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TestimonialCard v-for="t in block.items" :key="t.name" v-bind="t" />
      </div>
    </div>
  </section>
</template>
