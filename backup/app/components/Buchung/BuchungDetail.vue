<script setup lang="ts">
import type { BuchungDetail as BuchungDetailT } from '~~/shared/types/buchung'

const props = defineProps<{
  buchung: BuchungDetailT
  canCancel: boolean
  cancelDisabledReason: string | null
  pending: boolean
}>()

const emit = defineEmits<{ cancel: [] }>()

const localePath = useLocalePath()

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
      <BuchungStatusBadge :status="buchung.status" />
    </div>

    <dl class="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
      <div>
        <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.date') }}</dt>
        <dd class="mt-1 font-medium text-foreground">
          <template v-if="buchung.termin">
            {{ formatDatum(buchung.termin.date_from) }} – {{ formatDatum(buchung.termin.date_to) }}
            <span v-if="buchung.termin.hinweis" class="block text-sm text-muted-foreground">
              {{ buchung.termin.hinweis }}
            </span>
          </template>
          <template v-else-if="buchung.wunsch_datum">
            {{ $t('booking.wish_date') }}: {{ formatDatum(buchung.wunsch_datum) }}
          </template>
        </dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.persons') }}</dt>
        <dd class="mt-1 font-medium text-foreground">{{ buchung.personen_anzahl }}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.price_total') }}</dt>
        <dd class="mt-1 font-medium text-foreground">{{ buchung.preis_gesamt }} EUR</dd>
      </div>
      <div>
        <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.created_at') }}</dt>
        <dd class="mt-1 font-medium text-foreground">
          {{ new Date(buchung.date_created).toLocaleDateString('de-DE') }}
        </dd>
      </div>
    </dl>

    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 class="font-heading text-lg text-foreground">{{ $t('booking.contact_detail') }}</h2>
      <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.name') }}</dt>
          <dd>{{ buchung.kontakt_vorname }} {{ buchung.kontakt_nachname }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.email') }}</dt>
          <dd>{{ buchung.kontakt_email }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.phone') }}</dt>
          <dd>{{ buchung.kontakt_telefon }}</dd>
        </div>
      </dl>
      <div v-if="buchung.notizen" class="mt-4">
        <dt class="text-xs uppercase text-muted-foreground">{{ $t('booking.notes') }}</dt>
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
          {{ pending ? $t('form.loading') : $t('booking.cancel_booking') }}
        </Button>
        <span v-if="!canCancel && cancelDisabledReason" class="text-xs text-muted-foreground">
          {{ cancelDisabledReason }}
        </span>
      </template>
      <NuxtLink
        :to="localePath(`/touren/${buchung.tour.slug}`)"
        class="text-sm font-medium text-primary hover:underline"
      >
        {{ $t('tour.to_tour') }}
      </NuxtLink>
    </div>

    <AlertDialog v-model:open="confirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('booking.cancel_confirm') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('booking.cancel_irreversible') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ $t('form.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="onConfirm">{{ $t('booking.cancel_booking') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
