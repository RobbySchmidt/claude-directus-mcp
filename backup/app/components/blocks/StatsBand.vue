<script setup lang="ts">
type StatItem = { value: string; label: string; icon: string }
type StatsBandBlock = { items: StatItem[] | null }

const props = defineProps<{ id: string; collection: string; index: number }>()
const { locale } = useI18n()

const { data: block } = await useAsyncData(
  `block-${props.collection}-${props.id}-${locale.value}`,
  () => $fetch<StatsBandBlock>('/api/content/block', {
    query: { collection: props.collection, id: props.id, locale: locale.value },
  }),
  { watch: [locale] },
)
</script>

<template>
  <section v-if="block?.items?.length" class="relative bg-background py-f-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(stat, i) in block.items"
          :key="i"
          class="flex items-center gap-5 rounded-2xl border border-border bg-card p-6"
        >
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <span class="h-8 w-8">
              <BlocksBlockIcon :name="stat.icon" />
            </span>
          </div>
          <div>
            <p class="font-heading text-f-4xl font-semibold leading-none text-foreground">
              {{ stat.value }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
