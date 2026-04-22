<script setup lang="ts">
defineProps<{
  included: string[] | null
  notIncluded: string[] | null
}>()
</script>

<template>
  <section v-if="included?.length || notIncluded?.length" class="bg-muted/30">
    <div class="mx-auto max-w-7xl px-4 py-f-16 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2">
        <div v-if="included?.length">
          <h2 class="font-heading text-f-2xl font-medium text-foreground">Dabei</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="item in included" :key="item" class="flex items-start gap-3">
              <svg
                class="mt-0.5 h-5 w-5 shrink-0 text-primary"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm text-foreground">{{ item }}</span>
            </li>
          </ul>
        </div>
        <div v-if="notIncluded?.length">
          <h2 class="font-heading text-f-2xl font-medium text-foreground">Nicht dabei</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="item in notIncluded" :key="item" class="flex items-start gap-3">
              <svg
                class="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span class="text-sm text-foreground">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
