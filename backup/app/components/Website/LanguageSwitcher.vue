<script setup lang="ts">
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const alternateLocales = useAlternateLocales()

type LocaleObject = { code: string; name?: string; iso?: string }
const available = computed<LocaleObject[]>(() => (locales.value as LocaleObject[]))

function isAvailable(code: string): boolean {
  const alt = alternateLocales.value
  if (!alt) return true
  const iso = available.value.find((l) => l.code === code)?.iso
  return !iso || !!alt[iso]
}
</script>

<template>
  <div class="flex items-center gap-3 text-sm">
    <template v-for="l in available" :key="l.code">
      <NuxtLink
        v-if="isAvailable(l.code)"
        :to="switchLocalePath(l.code)"
        :class="l.code === locale ? 'font-semibold text-primary' : 'text-foreground/70 hover:text-primary'"
      >
        {{ l.code.toUpperCase() }}
      </NuxtLink>
      <span
        v-else
        :title="t('common.not_available_in_language')"
        class="cursor-not-allowed text-foreground/30"
      >
        {{ l.code.toUpperCase() }}
      </span>
    </template>
  </div>
</template>
