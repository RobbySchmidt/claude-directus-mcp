<script setup lang="ts">
type BenefitItem = {
  icon: 'peak' | 'boot' | 'compass' | 'tree' | 'sun' | 'trail'
  title: string
  description: string
}
type BenefitsBlock = {
  eyebrow: string | null
  headline: string | null
  lead: string | null
  items: BenefitItem[] | null
}

const props = defineProps<{ id: string; collection: string; index: number }>()

const { data: block } = await useAsyncData(
  `block-${props.collection}-${props.id}`,
  () => $fetch<BenefitsBlock>('/api/content/block', {
    query: { collection: props.collection, id: props.id },
  }),
)
</script>

<template>
  <section v-if="block" id="benefits" class="bg-background py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid items-start gap-12 lg:grid-cols-[1fr_2fr]">
        <div class="lg:sticky lg:top-28">
          <span v-if="block.eyebrow" class="text-xs font-medium uppercase tracking-widest text-primary">
            {{ block.eyebrow }}
          </span>
          <h2 v-if="block.headline" class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight text-foreground">
            {{ block.headline }}
          </h2>
          <p v-if="block.lead" class="mt-5 text-f-lg leading-relaxed text-muted-foreground">
            {{ block.lead }}
          </p>
        </div>

        <div v-if="block.items?.length" class="grid gap-5 sm:grid-cols-2">
          <BenefitCard v-for="b in block.items" :key="b.title" v-bind="b" />
        </div>
      </div>
    </div>
  </section>
</template>
