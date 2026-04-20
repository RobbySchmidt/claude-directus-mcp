<script setup lang="ts">
const email = ref('')
const submitted = ref(false)

const onSubmit = (e: Event) => {
  e.preventDefault()
  if (email.value) submitted.value = true
}
</script>

<template>
  <section class="bg-background py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="relative overflow-hidden rounded-3xl bg-foreground px-6 py-f-20 text-background sm:px-12 lg:px-16">
        <div class="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div class="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />

        <div class="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span class="text-xs font-medium uppercase tracking-widest text-accent">Newsletter</span>
            <h2 class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight">
              Neue Routen, zuerst in deinem Posteingang.
            </h2>
            <p class="mt-4 max-w-lg text-f-lg text-background/75">
              Einmal im Monat: neue Touren, Plätze in begrenzten Gruppen und Tipps
              von unseren Guides. Kein Spam. Jederzeit abbestellbar.
            </p>
          </div>

          <form v-if="!submitted" class="flex flex-col gap-3 sm:flex-row" @submit="onSubmit">
            <input
              v-model="email"
              type="email"
              required
              placeholder="deine@email.de"
              class="h-12 flex-1 rounded-xl border border-background/20 bg-background/10 px-5 text-background placeholder:text-background/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <Button
              type="submit"
              size="lg"
              class="h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90"
            >
              Abonnieren
            </Button>
          </form>
          <div
            v-else
            class="rounded-xl border border-accent/40 bg-accent/10 p-5 text-background"
          >
            <p class="font-heading text-xl">Danke — bis gleich im Posteingang!</p>
            <p class="mt-1 text-sm text-background/75">
              Wir haben dir eine Bestätigungsmail geschickt.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
