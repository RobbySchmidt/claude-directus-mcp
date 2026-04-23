<script setup lang="ts">
withDefaults(defineProps<{
  items?: Array<{ icon: string; value: string; label: string }> | null
}>(), { items: null })
</script>

<template>
  <section class="relative bg-background py-f-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          v-for="item in items"
          :key="item.value"
          :value="item.value"
          :label="item.label"
          :icon="item.icon"
        />
      </div>
    </div>
  </section>
</template>
