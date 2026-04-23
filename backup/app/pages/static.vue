<script setup lang="ts">
const { public: pub } = useRuntimeConfig()
const { locale, t } = useI18n()

useSeoMeta({
  title: () => `${t('nav.site_title')} — ${t('footer.brand_claim').split('.')[0]}`,
  description: () => t('footer.brand_claim'),
  htmlAttrs: { lang: locale.value },
})
</script>

<template>
  <SectionsSectionHero />
  <SectionsSectionStats />
  <SectionsSectionTours />
  <SectionsSectionBenefits />
  <SectionsSectionRegions />
  <SectionsSectionTestimonials />
  <SectionsSectionNewsletter />
</template>
