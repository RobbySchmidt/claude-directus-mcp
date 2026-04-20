<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon: 'peak' | 'boot' | 'compass' | 'tree' | 'sun' | 'trail'
}>()
</script>

<template>
  <div
    class="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
  >
    <div
      class="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
    >
      <IllustrationsIconPeak v-if="icon === 'peak'" class="h-7 w-7" />
      <IllustrationsIconBoot v-else-if="icon === 'boot'" class="h-7 w-7" />
      <IllustrationsIconCompass v-else-if="icon === 'compass'" class="h-7 w-7" />
      <IllustrationsIconTree v-else-if="icon === 'tree'" class="h-7 w-7" />
      <IllustrationsIconSun v-else-if="icon === 'sun'" class="h-7 w-7" />
      <IllustrationsIconTrail v-else class="h-7 w-7" />
    </div>
    <h3 class="font-heading text-f-2xl font-medium text-foreground">{{ title }}</h3>
    <p class="mt-2 text-f-lg leading-relaxed text-muted-foreground">{{ description }}</p>
  </div>
</template>
