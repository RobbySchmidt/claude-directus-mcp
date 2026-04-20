<script setup lang="ts">
import type { PageBlockRef } from '~~/shared/types/content'

defineProps<{
  blocks: PageBlockRef[]
}>()

const map: Record<string, ReturnType<typeof resolveComponent>> = {
  block_heroBanner: resolveComponent('LazyBlocksHeroBanner'),
  block_statsBand: resolveComponent('LazyBlocksStatsBand'),
  block_tourGrid: resolveComponent('LazyBlocksTourGrid'),
  block_benefits: resolveComponent('LazyBlocksBenefits'),
  block_regionList: resolveComponent('LazyBlocksRegionList'),
  block_testimonials: resolveComponent('LazyBlocksTestimonials'),
  block_newsletter: resolveComponent('LazyBlocksNewsletter'),
}
</script>

<template>
  <div class="relative z-10" id="content">
    <template v-for="(block, index) in blocks" :key="`${block.collection}-${block.item}`">
      <component
        v-if="map[block.collection] && block.item"
        :is="map[block.collection]"
        :index="index"
        :id="block.item"
        :collection="block.collection"
      />
    </template>
  </div>
</template>
