<script setup lang="ts">
defineProps<{
  title: string
  items: Array<{ id: number; title: string; href: string; open_in_new_tab: boolean }>
}>()
</script>

<template>
  <div>
    <h3 class="font-heading text-sm font-semibold uppercase tracking-widest">{{ title }}</h3>
    <ul class="mt-5 space-y-3">
      <li v-for="it in items" :key="it.id">
        <NuxtLink
          :to="it.href"
          :target="it.open_in_new_tab ? '_blank' : undefined"
          class="text-sm text-background/70 transition-colors hover:text-accent"
        >
          {{ it.title }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
