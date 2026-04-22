<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import type { BuchungCreateInput, TerminPublic } from '~~/shared/types/buchung'

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

const WUNSCH_VALUE = '__wunsch__'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function tomorrowIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

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

const formSchema = toTypedSchema(
  z
    .object({
      termin: z.string().min(1, 'Bitte wähle einen Termin oder Wunschdatum.'),
      wunschDatum: z.string().optional(),
      personen: z.coerce
        .number({ message: 'Personenzahl muss eine Zahl sein.' })
        .int('Personenzahl muss ganzzahlig sein.')
        .min(1, 'Mindestens 1 Person.'),
      vorname: z.string().min(1, 'Vorname ist ein Pflichtfeld.'),
      nachname: z.string().min(1, 'Nachname ist ein Pflichtfeld.'),
      email: z.string().min(1, 'E-Mail ist ein Pflichtfeld.').email('Ungültige E-Mail-Adresse.'),
      telefon: z.string().min(1, 'Telefon ist ein Pflichtfeld.'),
      notizen: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.termin === WUNSCH_VALUE) {
        if (!data.wunschDatum) {
          ctx.addIssue({
            code: 'custom',
            path: ['wunschDatum'],
            message: 'Bitte gib ein Wunschdatum an.',
          })
        } else if (data.wunschDatum <= todayIso()) {
          ctx.addIssue({
            code: 'custom',
            path: ['wunschDatum'],
            message: 'Wunschdatum muss in der Zukunft liegen.',
          })
        }
      }
    }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    termin: '',
    wunschDatum: '',
    personen: 1,
    vorname: props.initialContact.vorname,
    nachname: props.initialContact.nachname,
    email: props.initialContact.email,
    telefon: '',
    notizen: '',
  },
})

const currentTerminValue = form.values.termin
const selectedTermin = computed(() =>
  props.termine.find((t) => t.id === form.values.termin) ?? null,
)

const maxPersonen = computed(() => {
  if (selectedTermin.value && selectedTermin.value.verfuegbare_plaetze !== -1) {
    return selectedTermin.value.verfuegbare_plaetze
  }
  return props.groupSizeMax ?? 20
})

const selectedPrice = computed(() => {
  if (selectedTermin.value?.price_override != null) {
    return selectedTermin.value.price_override
  }
  return props.tourPriceFrom ?? 0
})

const preisGesamt = computed(() => selectedPrice.value * (form.values.personen ?? 1))

const onSubmit = form.handleSubmit((values) => {
  const base: BuchungCreateInput = {
    tour: props.tourId,
    personen_anzahl: values.personen,
    kontakt_vorname: values.vorname,
    kontakt_nachname: values.nachname,
    kontakt_email: values.email,
    kontakt_telefon: values.telefon,
    notizen: values.notizen || null,
  }
  if (values.termin === WUNSCH_VALUE) {
    emit('submit', { ...base, termin: null, wunsch_datum: values.wunschDatum ?? null })
  } else {
    emit('submit', { ...base, termin: values.termin, wunsch_datum: null })
  }
})
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <div>
      <h2 class="font-heading text-f-2xl font-medium text-foreground">{{ tourTitle }} buchen</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Wähle einen Termin oder gib ein Wunschdatum an. Wir bestätigen deine Anfrage innerhalb von 48 Stunden.
      </p>
    </div>

    <FormField v-slot="{ componentField }" name="termin">
      <FormItem>
        <FormLabel>Termin *</FormLabel>
        <FormControl>
          <select
            v-bind="componentField"
            class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Bitte wählen…</option>
            <option
              v-for="t in termine"
              :key="t.id"
              :value="t.id"
              :disabled="t.ausgebucht"
            >
              {{ terminLabel(t) }}
            </option>
            <option :value="WUNSCH_VALUE">Wunschdatum angeben…</option>
          </select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-if="form.values.termin === WUNSCH_VALUE" v-slot="{ componentField }" name="wunschDatum">
      <FormItem>
        <FormLabel>Wunschdatum *</FormLabel>
        <FormControl>
          <Input type="date" :min="tomorrowIso()" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="personen">
      <FormItem>
        <FormLabel>Personen *</FormLabel>
        <FormControl>
          <Input type="number" :min="1" :max="maxPersonen" v-bind="componentField" />
        </FormControl>
        <FormDescription>Max. {{ maxPersonen }} Personen</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="grid gap-4 sm:grid-cols-2">
      <FormField v-slot="{ componentField }" name="vorname">
        <FormItem>
          <FormLabel>Vorname *</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="nachname">
        <FormItem>
          <FormLabel>Nachname *</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>E-Mail *</FormLabel>
          <FormControl>
            <Input type="email" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="telefon">
        <FormItem>
          <FormLabel>Telefon *</FormLabel>
          <FormControl>
            <Input type="tel" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <FormField v-slot="{ componentField }" name="notizen">
      <FormItem>
        <FormLabel>Notizen (optional)</FormLabel>
        <FormControl>
          <Textarea rows="4" placeholder="Besondere Wünsche, Fragen…" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="rounded-md border border-border bg-muted/40 p-4">
      <div class="flex items-baseline justify-between">
        <span class="text-sm font-medium text-foreground">Preis (Snapshot)</span>
        <span class="font-heading text-f-xl text-foreground">{{ preisGesamt }} EUR</span>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ selectedPrice }} EUR × {{ form.values.personen ?? 1 }} Personen
      </p>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-700">{{ errorMessage }}</p>

    <Button type="submit" :disabled="pending" size="lg" class="w-full">
      {{ pending ? 'Wird gesendet…' : 'Anfrage senden' }}
    </Button>
  </form>
</template>
