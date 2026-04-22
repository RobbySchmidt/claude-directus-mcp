<script setup lang="ts">
import type { TerminPublic } from '~~/shared/types/buchung'

export type TerminSelectValue =
  | { type: 'termin'; terminId: string }
  | { type: 'wunsch'; datum: string }
  | { type: 'none' }

const props = defineProps<{
  termine: TerminPublic[]
  modelValue: TerminSelectValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TerminSelectValue]
}>()

function formatDatum(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function terminLabel(t: TerminPublic) {
  const von = formatDatum(t.date_from)
  const bis = formatDatum(t.date_to)
  const rest =
    t.verfuegbare_plaetze === -1
      ? ''
      : t.ausgebucht
      ? ' — Ausgebucht'
      : ` — noch ${t.verfuegbare_plaetze} Plätze`
  return `${von} – ${bis}${rest}`
}

const selectedValue = computed(() => {
  if (props.modelValue.type === 'termin') return props.modelValue.terminId
  if (props.modelValue.type === 'wunsch') return '__wunsch__'
  return ''
})

const wunschDatum = ref(
  props.modelValue.type === 'wunsch' ? props.modelValue.datum : '',
)

function onSelectChange(val: string) {
  if (val === '__wunsch__') {
    emit('update:modelValue', { type: 'wunsch', datum: wunschDatum.value })
  } else if (val) {
    emit('update:modelValue', { type: 'termin', terminId: val })
  } else {
    emit('update:modelValue', { type: 'none' })
  }
}

function onWunschDatumChange(datum: string) {
  wunschDatum.value = datum
  if (props.modelValue.type === 'wunsch') {
    emit('update:modelValue', { type: 'wunsch', datum })
  }
}

const tomorrowStr = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label for="termin-select">Termin</Label>
      <select
        id="termin-select"
        class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        :value="selectedValue"
        @change="(e) => onSelectChange((e.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Bitte wählen…</option>
        <option
          v-for="t in termine"
          :key="t.id"
          :value="t.id"
          :disabled="t.ausgebucht"
        >
          {{ terminLabel(t) }}
        </option>
        <option value="__wunsch__">Wunschdatum angeben…</option>
      </select>
    </div>
    <div v-if="modelValue.type === 'wunsch'">
      <Label for="wunsch-datum">Wunschdatum</Label>
      <Input
        id="wunsch-datum"
        type="date"
        :min="tomorrowStr"
        :model-value="wunschDatum"
        @update:model-value="(v) => onWunschDatumChange(String(v ?? ''))"
      />
    </div>
  </div>
</template>
