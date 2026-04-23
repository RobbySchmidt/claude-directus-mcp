<script setup lang="ts">
const { locale } = useI18n()
const localeHead = useLocaleHead({ seo: true })
useHead({
  htmlAttrs: { lang: locale },
  link: computed(() => localeHead.value.link ?? []),
  meta: computed(() => localeHead.value.meta ?? []),
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
