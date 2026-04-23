<script setup lang="ts">
defineProps<{
  intro: string | null
  items: string[] | null
}>()
</script>

<template>
  <section class="bg-background">
    <div class="mx-auto max-w-7xl px-4 py-f-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <p v-if="intro" class="text-f-xl leading-relaxed text-foreground">{{ intro }}</p>
        <div v-if="items?.length" class="mt-f-10">
          <h2 class="font-heading text-f-3xl font-medium text-foreground">{{ $t('tour.highlights') }}</h2>
          <ul class="mt-6 grid gap-3 sm:grid-cols-2">
            <li
              v-for="item in items"
              :key="item"
              class="flex items-start gap-3 rounded-xl bg-muted/50 p-4"
            >
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
      </div>
    </div>
  </section>
</template>
