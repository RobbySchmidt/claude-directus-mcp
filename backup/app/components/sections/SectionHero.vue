<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string | null
  title?: string | null
  lead?: string | null
  ctaPrimaryLabel?: string | null
  ctaSecondaryLabel?: string | null
  ratingText?: string | null
  certBadge?: string | null
}>(), {
  eyebrow: null,
  title: null,
  lead: null,
  ctaPrimaryLabel: null,
  ctaSecondaryLabel: null,
  ratingText: null,
  certBadge: null,
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

const skyStyle = computed(() => ({
  transform: `translate3d(0, ${scrollY.value * 0.35}px, 0)`,
}))
const backStyle = computed(() => ({
  transform: `translate3d(0, ${scrollY.value * 0.22}px, 0)`,
}))
const midStyle = computed(() => ({
  transform: `translate3d(0, ${scrollY.value * 0.1}px, 0)`,
}))
const contentStyle = computed(() => ({
  transform: `translate3d(0, ${scrollY.value * -0.15}px, 0)`,
  opacity: Math.max(0, 1 - scrollY.value / 600),
}))
</script>

<template>
  <section class="relative isolate min-h-screen overflow-hidden pt-20">
    <!-- Fallback background gradient so parallax-translated layers never reveal blank space -->
    <div
      class="absolute inset-0 -z-20 bg-linear-to-b from-[#f4d9b8] via-[#e8c5c8] to-[#b6c8d9]"
      aria-hidden="true"
    />

    <!-- Parallax layers, deepest (slowest) to nearest -->
    <div class="absolute inset-0 -z-10" aria-hidden="true">
      <div class="absolute inset-0 will-change-transform" :style="skyStyle">
        <IllustrationsHeroSky />
      </div>
      <div class="absolute inset-0 will-change-transform" :style="backStyle">
        <IllustrationsHeroBack />
      </div>
      <div class="absolute inset-0 will-change-transform" :style="midStyle">
        <IllustrationsHeroMid />
      </div>
      <!-- Front layer: no translation, scrolls naturally with the section -->
      <div class="absolute inset-0">
        <IllustrationsHeroFront />
      </div>
      <!-- Soft fade-out at bottom for smoother transition into next section -->
      <div class="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background/80" />
    </div>

    <div class="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-4 py-f-20 sm:px-6 lg:px-8">
      <div class="max-w-3xl will-change-transform" :style="contentStyle">
        <span
          class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary backdrop-blur-sm"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-accent" />
          {{ eyebrow }}
        </span>

        <h1 class="mt-6 font-heading text-f-7xl font-semibold leading-[1.05] tracking-tight text-foreground">
          {{ title }}
        </h1>

        <p class="mt-6 max-w-2xl text-f-xl leading-relaxed text-foreground/80">
          {{ lead }}
        </p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" class="h-12 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90">
            {{ ctaPrimaryLabel ?? $t('cta.discover_tours') }}
          </Button>
          <Button size="lg" variant="ghost" class="h-12 px-6 text-base text-foreground hover:bg-background/60">
            {{ ctaSecondaryLabel }}
            <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div v-if="ratingText || certBadge" class="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-foreground/70">
          <div v-if="ratingText" class="flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l2.4 5 5.6.6-4.2 3.9 1.2 5.5L10 14.5 4.8 17l1.2-5.5L2 7.6 7.6 7z" />
            </svg>
            {{ ratingText }}
          </div>
          <div v-if="certBadge" class="flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M12 21a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            {{ certBadge }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
