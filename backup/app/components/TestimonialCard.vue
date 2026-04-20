<script setup lang="ts">
defineProps<{
  quote: string
  name: string
  tour: string
  initials: string
}>()
</script>

<template>
  <figure class="flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-sm">
    <svg class="h-8 w-8 text-accent" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M10 8C6 8 3 11 3 15v9h9v-9H7c0-3 2-5 3-5V8zm13 0c-4 0-7 3-7 7v9h9v-9h-5c0-3 2-5 3-5V8z" />
    </svg>
    <blockquote class="mt-4 flex-1 font-heading text-f-xl italic leading-relaxed text-foreground">
      „{{ quote }}"
    </blockquote>
    <figcaption class="mt-6 flex items-center gap-4 border-t border-border pt-5">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-heading font-semibold text-primary-foreground"
      >
        {{ initials }}
      </div>
      <div>
        <p class="font-semibold text-foreground">{{ name }}</p>
        <p class="text-sm text-muted-foreground">{{ tour }}</p>
      </div>
    </figcaption>
  </figure>
</template>
