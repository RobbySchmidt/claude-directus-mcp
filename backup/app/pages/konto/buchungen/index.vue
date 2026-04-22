<script setup lang="ts">
import { useSeoMeta } from '#imports'
import type { BuchungListItem, BuchungResult } from '~~/shared/types/buchung'

definePageMeta({ layout: false, middleware: 'auth' })

const { public: pub } = useRuntimeConfig()
const route = useRoute()

useSeoMeta({ title: () => `Meine Buchungen | ${pub.siteName}` })

const { data: res, pending } = await useFetch<BuchungResult<BuchungListItem[]>>('/api/buchungen', {
  key: 'buchungen-list',
})

const buchungen = computed(() => (res.value?.ok ? res.value.data : []))
const errorMsg = computed(() => (res.value && !res.value.ok ? res.value.message : null))

const justCreatedId = computed(() => {
  const q = route.query.created
  return typeof q === 'string' ? q : null
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <SectionsTheHeader />
    <main class="pt-[68px]">
      <section class="mx-auto max-w-3xl px-4 py-f-12 sm:px-6 lg:px-8">
        <nav class="mb-6 flex gap-4 text-sm">
          <NuxtLink to="/konto" class="text-muted-foreground hover:text-foreground">Profil</NuxtLink>
          <NuxtLink to="/konto/passwort" class="text-muted-foreground hover:text-foreground">Passwort</NuxtLink>
          <NuxtLink to="/konto/buchungen" class="font-medium text-foreground">Buchungen</NuxtLink>
        </nav>

        <h1 class="font-heading text-f-5xl font-medium text-foreground">Meine Buchungen</h1>

        <div
          v-if="justCreatedId"
          class="mt-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          Anfrage erhalten — wir melden uns binnen 48 Stunden.
        </div>

        <p v-if="pending" class="mt-8 text-muted-foreground">Lädt…</p>
        <p v-else-if="errorMsg" class="mt-8 text-red-700">{{ errorMsg }}</p>
        <p v-else-if="!buchungen.length" class="mt-8 text-muted-foreground">
          Du hast noch keine Buchungen.
        </p>
        <div v-else class="mt-8 flex flex-col gap-3">
          <BuchungCard v-for="b in buchungen" :key="b.id" :buchung="b" />
        </div>
      </section>
    </main>
    <SectionsTheFooter />
  </div>
</template>
