<script setup lang="ts">
type NewsletterBlock = {
  eyebrow: string | null
  headline: string | null
  lead: string | null
  placeholder: string | null
  cta_label: string | null
  success_title: string | null
  success_text: string | null
}

const props = defineProps<{ id: string; collection: string; index: number }>()
const { locale } = useI18n()

const { data: block } = await useAsyncData(
  `block-${props.collection}-${props.id}-${locale.value}`,
  () => $fetch<NewsletterBlock>('/api/content/block', {
    query: { collection: props.collection, id: props.id, locale: locale.value },
  }),
  { watch: [locale] },
)

const email = ref('')
const submitted = ref(false)

const onSubmit = (e: Event) => {
  e.preventDefault()
  if (email.value) submitted.value = true
}
</script>

<template>
  <section v-if="block" class="bg-background py-f-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="relative overflow-hidden rounded-3xl bg-foreground px-6 py-f-20 text-background sm:px-12 lg:px-16">
        <div class="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div class="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />

        <div class="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span v-if="block.eyebrow" class="text-xs font-medium uppercase tracking-widest text-accent">
              {{ block.eyebrow }}
            </span>
            <h2 v-if="block.headline" class="mt-3 font-heading text-f-5xl font-medium leading-tight tracking-tight">
              {{ block.headline }}
            </h2>
            <p v-if="block.lead" class="mt-4 max-w-lg text-f-lg text-background/75">
              {{ block.lead }}
            </p>
          </div>

          <form v-if="!submitted" class="flex flex-col gap-3 sm:flex-row" @submit="onSubmit">
            <input
              v-model="email"
              type="email"
              required
              :placeholder="block.placeholder ?? 'deine@email.de'"
              class="h-12 flex-1 rounded-xl border border-background/20 bg-background/10 px-5 text-background placeholder:text-background/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <Button
              type="submit"
              size="lg"
              class="h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90"
            >
              {{ block.cta_label ?? 'Abonnieren' }}
            </Button>
          </form>
          <div
            v-else
            class="rounded-xl border border-accent/40 bg-accent/10 p-5 text-background"
          >
            <p class="font-heading text-xl">{{ block.success_title ?? 'Danke!' }}</p>
            <p v-if="block.success_text" class="mt-1 text-sm text-background/75">
              {{ block.success_text }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
