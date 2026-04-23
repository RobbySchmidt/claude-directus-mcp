<script setup lang="ts">
import { useSeoMeta } from '#imports'
import type { TourDetail } from '~~/shared/types/touren'
import type { BuchungCreateInput } from '~~/shared/types/buchung'

const localePath = useLocalePath()

definePageMeta({ layout: false, middleware: 'auth' })
defineI18nRoute({
  paths: {
    de: '/touren/:slug/buchen',
    en: '/tours/:slug/book',
  },
})

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const slug = String(route.params.slug)

const { public: pub } = useRuntimeConfig()
const { user } = useUser()
const { createBuchung } = useBuchungen()

const { data: tour, error } = await useFetch<TourDetail>('/api/content/tour', {
  query: { slug, locale: locale.value },
  key: `tour-buchen-${slug}`,
})

if (error.value || !tour.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tour nicht gefunden' })
}

useSeoMeta({ title: () => `${tour.value?.title} ${t('cta.book_tour')} | ${pub.siteName}` })

const pending = ref(false)
const errorMessage = ref<string | null>(null)

const onSubmit = async (payload: BuchungCreateInput) => {
  pending.value = true
  errorMessage.value = null
  const res = await createBuchung(payload)
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  await router.push(localePath(`/konto/buchungen`) + `?created=${res.data.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-17">
      <section class="mx-auto max-w-2xl px-4 py-f-12 sm:px-6 lg:px-8">
        <NuxtLink
          :to="localePath(`/touren/${slug}`)"
          class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {{ $t('common.back') }}
        </NuxtLink>
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <BuchungForm
            v-if="tour"
            :tour-id="tour.id"
            :tour-title="tour.title"
            :tour-price-from="tour.price_from"
            :group-size-max="tour.group_size_max"
            :termine="tour.termine"
            :initial-contact="{
              vorname: user?.first_name ?? '',
              nachname: user?.last_name ?? '',
              email: user?.email ?? '',
            }"
            :pending="pending"
            :error-message="errorMessage"
            @submit="onSubmit"
          />
        </div>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
