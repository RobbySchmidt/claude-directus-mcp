<script setup lang="ts">
defineProps<{
  meetingPoint: string | null
  season: string | null
  priceFrom: number | null
}>()

const priceText = (v: number | null) =>
  v === null ? null : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
</script>

<template>
  <section v-if="meetingPoint || season || priceFrom" class="bg-background">
    <div class="mx-auto max-w-7xl px-4 py-f-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-f-8 shadow-sm">
        <h2 class="font-heading text-f-2xl font-medium text-foreground">Organisatorisches</h2>
        <dl class="mt-6 grid gap-6 sm:grid-cols-3">
          <div v-if="meetingPoint">
            <dt class="text-xs font-medium uppercase tracking-widest text-muted-foreground">Treffpunkt</dt>
            <dd class="mt-1 text-sm text-foreground">{{ meetingPoint }}</dd>
          </div>
          <div v-if="season">
            <dt class="text-xs font-medium uppercase tracking-widest text-muted-foreground">Saison</dt>
            <dd class="mt-1 text-sm text-foreground">{{ season }}</dd>
          </div>
          <div v-if="priceFrom !== null">
            <dt class="text-xs font-medium uppercase tracking-widest text-muted-foreground">Preis</dt>
            <dd class="mt-1 text-sm text-foreground">ab {{ priceText(priceFrom) }} p. P.</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
