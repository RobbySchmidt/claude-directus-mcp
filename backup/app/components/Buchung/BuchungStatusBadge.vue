<script setup lang="ts">
import type { BuchungStatus } from '~~/shared/types/buchung'

const props = defineProps<{ status: BuchungStatus }>()

const label: Record<BuchungStatus, string> = {
  angefragt: 'Angefragt',
  bestaetigt: 'Bestätigt',
  storniert: 'Storniert',
  abgelehnt: 'Abgelehnt',
  durchgefuehrt: 'Durchgeführt',
}

const cls: Record<BuchungStatus, string> = {
  angefragt: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  bestaetigt: 'bg-green-100 text-green-900 border-green-300',
  storniert: 'bg-gray-100 text-gray-700 border-gray-300',
  abgelehnt: 'bg-red-100 text-red-900 border-red-300',
  durchgefuehrt: 'bg-blue-100 text-blue-900 border-blue-300',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
    :class="cls[props.status]"
  >
    {{ label[props.status] }}
  </span>
</template>
