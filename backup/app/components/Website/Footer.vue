<script setup lang="ts">
const { footer, footerLegal } = await useNavigation()
const localePath = useLocalePath()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-foreground text-background">
    <div class="mx-auto max-w-7xl px-4 py-f-20 sm:px-6 lg:px-8">
      <div class="grid gap-12 lg:grid-cols-[1.5fr_3fr]">
        <div>
          <NuxtLink :to="localePath('/')" class="flex items-center gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IllustrationsIconPeak class="h-6 w-6" />
            </div>
            <span class="font-heading text-2xl font-semibold">{{ $t('nav.site_title') }}</span>
          </NuxtLink>
          <p class="mt-5 max-w-sm text-sm leading-relaxed text-background/70">
            {{ $t('footer.brand_claim') }}
          </p>
          <div class="mt-6 flex gap-3" :aria-label="$t('footer.social_aria')">
            <a
              v-for="sn in ['IG', 'FB', 'YT']"
              :key="sn"
              href="#"
              class="flex h-10 w-10 items-center justify-center rounded-lg border border-background/20 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
              :aria-label="sn"
            >
              {{ sn }}
            </a>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <WebsiteFooterColumn
            v-for="col in footer"
            :key="col.id"
            :title="col.title"
            :items="col.children"
          />
        </div>
      </div>

      <div class="mt-16 flex flex-col items-start justify-between gap-4 border-t border-background/15 pt-8 text-sm text-background/60 sm:flex-row sm:items-center">
        <p>{{ $t('footer.copyright', { year: currentYear }) }}</p>
        <div class="flex gap-6">
          <NuxtLink
            v-for="legal in footerLegal"
            :key="legal.id"
            :to="legal.href"
            class="hover:text-accent"
          >
            {{ legal.title }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
