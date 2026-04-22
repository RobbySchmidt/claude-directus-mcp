<script setup lang="ts">
import type { BuchungDetail as BuchungDetailT } from '~~/shared/types/buchung'

const props = defineProps<{
  buchung: BuchungDetailT
  canCancel: boolean
  cancelDisabledReason: string | null
  pending: boolean
}>()

const emit = defineEmits<{ cancel: [] }>()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const confirmOpen = ref(false)

function onConfirm() {
  confirmOpen.value = false
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h1 class="font-heading text-f-3xl text-foreground">{{ buchung.tour.title }}</h1>
      <BuchungBuchungStatusBadge :status="buchung.status" />
    </div>

    <dl class="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Termin</dt>
        <dd class="mt-1 font-medium text-foreground">
          <template v-if="buchung.termin">
            {{ formatDatum(buchung.termin.date_from) }} – {{ formatDatum(buchung.termin.date_to) }}
            <span v-if="buchung.termin.hinweis" class="block text-sm text-muted-foreground">
              {{ buchung.termin.hinweis }}
            </span>
          </template>
          <template v-else-if="buchung.wunsch_datum">
            Wunschdatum: {{ formatDatum(buchung.wunsch_datum) }}
          </template>
        </dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Personen</dt>
        <dd class="mt-1 font-medium text-foreground">{{ buchung.personen_anzahl }}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Preis (Snapshot)</dt>
        <dd class="mt-1 font-medium text-foreground">{{ buchung.preis_gesamt }} EUR</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">Angefragt am</dt>
        <dd class="mt-1 font-medium text-foreground">
          {{ new Date(buchung.date_created).toLocaleDateString('de-DE') }}
        </dd>
      </div>
    </dl>

    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 class="font-heading text-lg text-foreground">Kontakt zur Buchung</h2>
      <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs uppercase text-muted-foreground">Name</dt>
          <dd>{{ buchung.kontakt_vorname }} {{ buchung.kontakt_nachname }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-muted-foreground">E-Mail</dt>
          <dd>{{ buchung.kontakt_email }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-muted-foreground">Telefon</dt>
          <dd>{{ buchung.kontakt_telefon }}</dd>
        </div>
      </dl>
      <div v-if="buchung.notizen" class="mt-4">
        <dt class="text-xs uppercase text-muted-foreground">Notizen</dt>
        <dd class="mt-1 whitespace-pre-line text-sm text-foreground">{{ buchung.notizen }}</dd>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <template v-if="buchung.status === 'angefragt' || buchung.status === 'bestaetigt'">
        <Button
          variant="outline"
          :disabled="!canCancel || pending"
          :title="cancelDisabledReason ?? ''"
          @click="confirmOpen = true"
        >
          {{ pending ? 'Wird storniert…' : 'Buchung stornieren' }}
        </Button>
        <span v-if="!canCancel && cancelDisabledReason" class="text-xs text-muted-foreground">
          {{ cancelDisabledReason }}
        </span>
      </template>
      <NuxtLink
        :to="`/touren/${buchung.tour.slug}`"
        class="text-sm font-medium text-primary hover:underline"
      >
        Zur Tour
      </NuxtLink>
    </div>

    <AlertDialog v-model:open="confirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buchung wirklich stornieren?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction @click="onConfirm">Stornieren</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
