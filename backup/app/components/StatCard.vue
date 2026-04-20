<script setup lang="ts">
defineProps<{
  value: string
  label: string
  icon: 'peak' | 'compass' | 'boot'
}>()
</script>

<template>
  <div class="flex items-center gap-5 rounded-2xl border border-border bg-card p-6">
    <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
      <IllustrationsIconPeak v-if="icon === 'peak'" class="h-8 w-8" />
      <IllustrationsIconCompass v-else-if="icon === 'compass'" class="h-8 w-8" />
      <IllustrationsIconBoot v-else class="h-8 w-8" />
    </div>
    <div>
      <p class="font-heading text-f-4xl font-semibold leading-none text-foreground">
        {{ value }}
      </p>
      <p class="mt-1 text-sm text-muted-foreground">{{ label }}</p>
    </div>
  </div>
</template>
