<script setup lang="ts">
defineProps<{
  distance: string
  ascent: string
  duration: string
  groupSizeMax: number | null
}>()
</script>

<template>
  <section class="border-y border-border bg-card">
    <div class="mx-auto max-w-7xl px-4 py-f-8 sm:px-6 lg:px-8">
      <dl class="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
        <div>
          <dt class="text-xs font-medium uppercase tracking-widest text-muted-foreground">{{ $t('tour.distance') }}</dt>
          <dd class="mt-1 font-heading text-f-2xl font-medium text-foreground">{{ distance }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-widest text-muted-foreground">{{ $t('tour.ascent') }}</dt>
          <dd class="mt-1 font-heading text-f-2xl font-medium text-foreground">{{ ascent }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-widest text-muted-foreground">{{ $t('tour.duration') }}</dt>
          <dd class="mt-1 font-heading text-f-2xl font-medium text-foreground">{{ duration }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-widest text-muted-foreground">{{ $t('tour.group_size') }}</dt>
          <dd class="mt-1 font-heading text-f-2xl font-medium text-foreground">
            {{ groupSizeMax ?? '—' }}
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>
