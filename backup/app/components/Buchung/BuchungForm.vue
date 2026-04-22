<script setup lang="ts">
import type { BuchungCreateInput, TerminPublic } from '~~/shared/types/buchung'
import type { TerminSelectValue } from './TerminSelect.vue'

const props = defineProps<{
  tourId: string
  tourTitle: string
  tourPriceFrom: number | null
  groupSizeMax: number | null
  termine: TerminPublic[]
  initialContact: {
    vorname: string
    nachname: string
    email: string
  }
  pending: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  submit: [payload: BuchungCreateInput]
}>()

const termin = ref<TerminSelectValue>({ type: 'none' })
const personen = ref<number>(1)
const vorname = ref(props.initialContact.vorname)
const nachname = ref(props.initialContact.nachname)
const email = ref(props.initialContact.email)
const telefon = ref('')
const notizen = ref('')

const maxPersonen = computed(() => {
  if (termin.value.type === 'termin') {
    const t = props.termine.find((x) => x.id === termin.value.terminId)
    if (t && t.verfuegbare_plaetze !== -1) return t.verfuegbare_plaetze
  }
  return props.groupSizeMax ?? 20
})

const selectedPrice = computed(() => {
  if (termin.value.type === 'termin') {
    const t = props.termine.find((x) => x.id === termin.value.terminId)
    if (t?.price_override != null) return t.price_override
  }
  return props.tourPriceFrom ?? 0
})

const preisGesamt = computed(() => selectedPrice.value * personen.value)

const canSubmit = computed(() => {
  if (props.pending) return false
  if (personen.value < 1 || personen.value > maxPersonen.value) return false
  if (!vorname.value || !nachname.value || !email.value || !telefon.value) return false
  if (termin.value.type === 'none') return false
  if (termin.value.type === 'wunsch' && !termin.value.datum) return false
  return true
})

function onSubmit(e: Event) {
  e.preventDefault()
  if (!canSubmit.value) return
  const base: BuchungCreateInput = {
    tour: props.tourId,
    personen_anzahl: personen.value,
    kontakt_vorname: vorname.value,
    kontakt_nachname: nachname.value,
    kontakt_email: email.value,
    kontakt_telefon: telefon.value,
    notizen: notizen.value || null,
  }
  if (termin.value.type === 'termin') {
    emit('submit', { ...base, termin: termin.value.terminId, wunsch_datum: null })
  } else if (termin.value.type === 'wunsch') {
    emit('submit', { ...base, termin: null, wunsch_datum: termin.value.datum })
  }
}
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <div>
      <h2 class="font-heading text-f-2xl font-medium text-foreground">{{ tourTitle }} buchen</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Wähle einen Termin oder gib ein Wunschdatum an. Wir bestätigen deine Anfrage innerhalb von 48 Stunden.
      </p>
    </div>

    <BuchungTerminSelect v-model="termin" :termine="termine" />

    <div>
      <Label for="personen">Personen</Label>
      <Input
        id="personen"
        type="number"
        :min="1"
        :max="maxPersonen"
        :model-value="personen"
        @update:model-value="(v) => (personen = Number(v) || 1)"
      />
      <p v-if="maxPersonen" class="mt-1 text-xs text-muted-foreground">
        Max. {{ maxPersonen }} Personen
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <Label for="vorname">Vorname</Label>
        <Input id="vorname" v-model="vorname" required />
      </div>
      <div>
        <Label for="nachname">Nachname</Label>
        <Input id="nachname" v-model="nachname" required />
      </div>
      <div>
        <Label for="email">E-Mail</Label>
        <Input id="email" v-model="email" type="email" required />
      </div>
      <div>
        <Label for="telefon">Telefon</Label>
        <Input id="telefon" v-model="telefon" type="tel" required />
      </div>
    </div>

    <div>
      <Label for="notizen">Notizen (optional)</Label>
      <Textarea id="notizen" v-model="notizen" rows="4" placeholder="Besondere Wünsche, Fragen…" />
    </div>

    <div class="rounded-md border border-border bg-muted/40 p-4">
      <div class="flex items-baseline justify-between">
        <span class="text-sm font-medium text-foreground">Preis (Snapshot)</span>
        <span class="font-heading text-f-xl text-foreground">{{ preisGesamt }} EUR</span>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ selectedPrice }} EUR × {{ personen }} Personen
      </p>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-700">{{ errorMessage }}</p>

    <Button type="submit" :disabled="!canSubmit" size="lg" class="w-full">
      {{ pending ? 'Wird gesendet…' : 'Anfrage senden' }}
    </Button>
  </form>
</template>
