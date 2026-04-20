<script setup lang="ts">
type Region = { name: string; tours: number }
type RegionListBlock = {
  eyebrow: string | null
  headline: string | null
  lead: string | null
  cta_label: string | null
  cta_href: string | null
  image: string | null
  regions: Region[] | null
}

const props = defineProps<{ id: string; collection: string; index: number }>()

const { data: block } = await useAsyncData(
  `block-${props.collection}-${props.id}`,
  () => $fetch<RegionListBlock>('/api/content/block', {
    query: { collection: props.collection, id: props.id },
  }),
)
</script>

<template>
  <section v-if="block" id="regionen" class="relative overflow-hidden bg-primary py-f-24 text-primary-foreground">
    <div class="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <span v-if="block.eyebrow" class="text-xs font-medium uppercase tracking-widest text-accent">
          {{ block.eyebrow }}
        </span>
        <h2 v-if="block.headline" class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight">
          {{ block.headline }}
        </h2>
        <p v-if="block.lead" class="mt-5 text-f-lg leading-relaxed text-primary-foreground/85">
          {{ block.lead }}
        </p>

        <ul v-if="block.regions?.length" class="mt-8 grid grid-cols-2 gap-x-8 gap-y-3">
          <li
            v-for="region in block.regions"
            :key="region.name"
            class="flex items-center justify-between border-b border-primary-foreground/15 pb-3"
          >
            <span class="font-medium">{{ region.name }}</span>
            <span class="text-sm text-primary-foreground/60">{{ region.tours }} Touren</span>
          </li>
        </ul>

        <Button
          v-if="block.cta_label"
          size="lg"
          class="mt-10 h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90"
          :as="block.cta_href ? 'a' : 'button'"
          :href="block.cta_href ?? undefined"
        >
          {{ block.cta_label }}
        </Button>
      </div>

      <div v-if="block.image" class="relative overflow-hidden rounded-3xl shadow-2xl">
        <img :src="asset(block.image)" alt="" class="block h-full w-full" />
      </div>
    </div>
  </section>
</template>
