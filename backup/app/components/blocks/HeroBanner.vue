<script setup lang="ts">
type HeroBannerBlock = {
  eyebrow: string | null
  title: string | null
  lead: string | null
  cta_primary_label: string | null
  cta_primary_href: string | null
  cta_secondary_label: string | null
  cta_secondary_href: string | null
  image_sky: string | null
  image_back: string | null
  image_mid: string | null
  image_front: string | null
  trust_signals: Array<{ icon: string; label: string }> | null
}

const props = defineProps<{ id: string; collection: string; index: number }>()
const { locale } = useI18n()

const { data: block } = await useAsyncData(
  `block-${props.collection}-${props.id}-${locale.value}`,
  () => $fetch<HeroBannerBlock>('/api/content/block', {
    query: { collection: props.collection, id: props.id, locale: locale.value },
  }),
  { watch: [locale] },
)

// Parse the rich-text title. Expected shape: `<p>TEXT <strong>HIGHLIGHT</strong> TEXT</p>`
// (the <strong> marks the word that gets the primary color + curvy underline in the original design).
const parsedTitle = computed(() => {
  const raw = block.value?.title
  if (!raw) return null
  const stripped = raw.replace(/<\/?p[^>]*>/gi, '').trim()
  const match = stripped.match(/^([\s\S]*?)<strong>([\s\S]*?)<\/strong>([\s\S]*?)$/i)
  if (match) return { pre: match[1], highlight: match[2], post: match[3] }
  return { pre: stripped, highlight: '', post: '' }
})

const scrollY = ref(0)
let rafId: number | null = null
let ticking = false

const onScroll = () => {
  if (ticking) return
  ticking = true
  rafId = requestAnimationFrame(() => {
    scrollY.value = window.scrollY
    ticking = false
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  scrollY.value = window.scrollY
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})

const skyStyle = computed(() => ({ transform: `translate3d(0, ${scrollY.value * 0.35}px, 0)` }))
const backStyle = computed(() => ({ transform: `translate3d(0, ${scrollY.value * 0.22}px, 0)` }))
const midStyle = computed(() => ({ transform: `translate3d(0, ${scrollY.value * 0.1}px, 0)` }))
const contentStyle = computed(() => ({
  transform: `translate3d(0, ${scrollY.value * -0.15}px, 0)`,
  opacity: Math.max(0, 1 - scrollY.value / 600),
}))
</script>

<template>
  <section v-if="block" class="relative isolate min-h-screen overflow-hidden pt-20">
    <div
      class="absolute inset-0 -z-20 bg-gradient-to-b from-[#f4d9b8] via-[#e8c5c8] to-[#b6c8d9]"
      aria-hidden="true"
    />

    <div class="absolute inset-0 -z-10" aria-hidden="true">
      <div v-if="block.image_sky" class="absolute inset-0 will-change-transform" :style="skyStyle">
        <img :src="asset(block.image_sky)" alt="" class="h-full w-full object-cover object-bottom" />
      </div>
      <div v-if="block.image_back" class="absolute inset-0 will-change-transform" :style="backStyle">
        <img :src="asset(block.image_back)" alt="" class="h-full w-full object-cover object-bottom" />
      </div>
      <div v-if="block.image_mid" class="absolute inset-0 will-change-transform" :style="midStyle">
        <img :src="asset(block.image_mid)" alt="" class="h-full w-full object-cover object-bottom" />
      </div>
      <div v-if="block.image_front" class="absolute inset-0">
        <img :src="asset(block.image_front)" alt="" class="h-full w-full object-cover object-bottom" />
      </div>
      <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background/80" />
    </div>

    <div class="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-4 py-f-20 sm:px-6 lg:px-8">
      <div class="max-w-3xl will-change-transform" :style="contentStyle">
        <span
          v-if="block.eyebrow"
          class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary backdrop-blur-sm"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-accent" />
          {{ block.eyebrow }}
        </span>

        <h1
          v-if="parsedTitle"
          class="mt-6 font-heading text-f-7xl font-semibold leading-[1.05] tracking-tight text-foreground"
        >
          {{ parsedTitle.pre }}<span v-if="parsedTitle.highlight" class="relative inline-block"><span class="relative z-10 text-primary">{{ parsedTitle.highlight }}</span><svg class="absolute -bottom-2 left-0 z-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 Q 50 2, 100 6 T 198 4" stroke="#f0a95c" stroke-width="3" fill="none" stroke-linecap="round" /></svg></span>{{ parsedTitle.post }}
        </h1>

        <p v-if="block.lead" class="mt-6 max-w-2xl text-f-xl leading-relaxed text-foreground/80">
          {{ block.lead }}
        </p>

        <div v-if="block.cta_primary_label || block.cta_secondary_label" class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            v-if="block.cta_primary_label"
            size="lg"
            class="h-12 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
            :as="block.cta_primary_href ? 'a' : 'button'"
            :href="block.cta_primary_href ?? undefined"
          >
            {{ block.cta_primary_label }}
          </Button>
          <Button
            v-if="block.cta_secondary_label"
            size="lg"
            variant="ghost"
            class="h-12 px-6 text-base text-foreground hover:bg-background/60"
            :as="block.cta_secondary_href ? 'a' : 'button'"
            :href="block.cta_secondary_href ?? undefined"
          >
            {{ block.cta_secondary_label }}
            <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div v-if="block.trust_signals?.length" class="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-foreground/70">
          <div
            v-for="(signal, i) in block.trust_signals"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="h-5 w-5 text-primary">
              <BlocksBlockIcon :name="signal.icon" />
            </span>
            {{ signal.label }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
