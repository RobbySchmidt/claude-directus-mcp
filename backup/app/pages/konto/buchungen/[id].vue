<script setup lang="ts">
import { useSeoMeta } from '#imports'
import type { BuchungDetail, BuchungResult } from '~~/shared/types/buchung'

const localePath = useLocalePath()

definePageMeta({ middleware: 'auth' })
defineI18nRoute({
  paths: {
    de: '/konto/buchungen/[id]',
    en: '/account/bookings/[id]',
  },
})

const { public: pub } = useRuntimeConfig()
const { t } = useI18n()
const route = useRoute()
const id = String(route.params.id)

const { cancelBuchung } = useBuchungen()

const { data: res, refresh } = await useFetch<BuchungResult<BuchungDetail>>(`/api/buchungen/${id}`, {
  key: `buchung-${id}`,
})

if (res.value && !res.value.ok) {
  throw createError({ statusCode: 404, statusMessage: 'Buchung nicht gefunden' })
}

const buchung = computed(() => (res.value?.ok ? res.value.data : null))
useSeoMeta({ title: () => `${t('booking.booking_detail')} ${id.slice(0, 8)} | ${pub.siteName}` })

const pending = ref(false)

const DAY_MS = 24 * 60 * 60 * 1000
const cancelState = computed<{ canCancel: boolean; reason: string | null }>(() => {
  const b = buchung.value
  if (!b) return { canCancel: false, reason: null }
  if (b.status === 'storniert') return { canCancel: false, reason: 'Bereits storniert.' }
  if (b.status !== 'angefragt' && b.status !== 'bestaetigt') {
    return { canCancel: false, reason: 'Storno nicht möglich.' }
  }
  if (b.termin) {
    const terminMs = new Date(b.termin.date_from + 'T00:00:00Z').getTime()
    if (terminMs - Date.now() < 14 * DAY_MS) {
      return { canCancel: false, reason: 'Storno weniger als 14 Tage vor Termin nicht möglich — bitte telefonisch.' }
    }
  }
  return { canCancel: true, reason: null }
})

async function onCancel() {
  pending.value = true
  const result = await cancelBuchung(id)
  pending.value = false
  if (!result.ok) {
    alert(result.message)
    return
  }
  await clearNuxtData('buchungen-list')
  await refresh()
}
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-f-12 sm:px-6 lg:px-8">
    <NuxtLink
      :to="localePath('/konto/buchungen')"
      class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      ← {{ $t('booking.my_bookings') }}
    </NuxtLink>
    <BuchungDetail
      v-if="buchung"
      :buchung="buchung"
      :can-cancel="cancelState.canCancel"
      :cancel-disabled-reason="cancelState.reason"
      :pending="pending"
      @cancel="onCancel"
    />
  </section>
</template>
