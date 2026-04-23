<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message?: string } }>()
const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${props.error.statusCode} - ${t('common.not_found_title')} | Alpenpfad`,
  robots: 'noindex',
})

async function goHome() {
  await clearError({ redirect: localePath('/') })
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <WebsiteHeader />
    <main class="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p class="mb-4 font-heading text-8xl font-semibold text-primary">{{ error.statusCode }}</p>
      <h1 class="font-heading text-3xl font-semibold">{{ $t('common.not_found_title') }}</h1>
      <p class="mt-4 max-w-md text-muted-foreground">{{ $t('common.not_found_lead') }}</p>
      <Button class="mt-8" @click="goHome">{{ $t('common.home') }}</Button>
    </main>
    <WebsiteFooter />
  </div>
</template>
