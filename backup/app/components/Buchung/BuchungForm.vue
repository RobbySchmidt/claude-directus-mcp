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

const { t } = useI18n()

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

function terminLabel(termin: TerminPublic) {
  const von = formatDatum(termin.date_from)
  const bis = formatDatum(termin.date_to)
  const rest =
    termin.verfuegbare_plaetze === -1
      ? ''
      : termin.ausgebucht
        ? ` — ${t('booking.sold_out')}`
        : ` — ${t('booking.places_left', { count: termin.verfuegbare_plaetze })}`
  return `${von} – ${bis}${rest}`
}

const buildSchema = () =>
  z
    .object({
      termin: z.string().min(1, { message: t('validation.required') }),
      wunschDatum: z.string().optional(),
      personen: z.coerce
        .number({ message: t('validation.invalid') })
        .int(t('validation.invalid'))
        .min(1, { message: t('validation.min_persons') }),
      vorname: z.string().min(1, { message: t('validation.required') }),
      nachname: z.string().min(1, { message: t('validation.required') }),
      email: z
        .string()
        .min(1, { message: t('validation.required') })
        .email({ message: t('validation.email') }),
      telefon: z.string().min(1, { message: t('validation.required') }),
      notizen: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.termin === WUNSCH_VALUE) {
        if (!data.wunschDatum) {
          ctx.addIssue({
            code: 'custom',
            path: ['wunschDatum'],
            message: t('validation.required'),
          })
        } else if (data.wunschDatum <= todayIso()) {
          ctx.addIssue({
            code: 'custom',
            path: ['wunschDatum'],
            message: t('validation.invalid'),
          })
        }
      }
    })

const formSchema = computed(() => toTypedSchema(buildSchema()))

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
  props.termine.find((termin) => termin.id === form.values.termin) ?? null,
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
      <h2 class="font-heading text-f-2xl font-medium text-foreground">{{ tourTitle }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ $t('booking.select_date') }}
      </p>
    </div>

    <FormField v-slot="{ componentField }" name="termin">
      <FormItem>
        <FormLabel>{{ $t('booking.select_date') }} *</FormLabel>
        <FormControl>
          <select
            v-bind="componentField"
            class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{{ $t('booking.select_placeholder') }}</option>
            <option
              v-for="termin in termine"
              :key="termin.id"
              :value="termin.id"
              :disabled="termin.ausgebucht"
            >
              {{ terminLabel(termin) }}
            </option>
            <option :value="WUNSCH_VALUE">{{ $t('booking.wish_date_placeholder') }}</option>
          </select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-if="form.values.termin === WUNSCH_VALUE" v-slot="{ componentField }" name="wunschDatum">
      <FormItem>
        <FormLabel>{{ $t('booking.wish_date') }} *</FormLabel>
        <FormControl>
          <Input type="date" :min="tomorrowIso()" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="personen">
      <FormItem>
        <FormLabel>{{ $t('booking.persons') }} *</FormLabel>
        <FormControl>
          <Input type="number" :min="1" :max="maxPersonen" v-bind="componentField" />
        </FormControl>
        <FormDescription>{{ $t('tour.group_size_max', { count: maxPersonen }) }}</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <div>
      <h3 class="mb-4 font-medium text-foreground">{{ $t('booking.contact_data') }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="{ componentField }" name="vorname">
          <FormItem>
            <FormLabel>{{ $t('booking.first_name') }} *</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="nachname">
          <FormItem>
            <FormLabel>{{ $t('booking.last_name') }} *</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>{{ $t('booking.email') }} *</FormLabel>
            <FormControl>
              <Input type="email" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="telefon">
          <FormItem>
            <FormLabel>{{ $t('booking.phone') }} *</FormLabel>
            <FormControl>
              <Input type="tel" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>
    </div>

    <FormField v-slot="{ componentField }" name="notizen">
      <FormItem>
        <FormLabel>{{ $t('booking.notes') }}</FormLabel>
        <FormControl>
          <Textarea rows="4" :placeholder="$t('booking.notes')" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="rounded-md border border-border bg-muted/40 p-4">
      <div class="flex items-baseline justify-between">
        <span class="text-sm font-medium text-foreground">{{ $t('booking.price_total') }}</span>
        <span class="font-heading text-f-xl text-foreground">{{ preisGesamt }} EUR</span>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ selectedPrice }} EUR × {{ form.values.personen ?? 1 }} {{ $t('booking.persons').toLowerCase() }}
      </p>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-700">{{ errorMessage }}</p>

    <Button type="submit" :disabled="pending" size="lg" class="w-full">
      {{ pending ? $t('form.loading') : $t('booking.submit_booking') }}
    </Button>
  </form>
</template>
