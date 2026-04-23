<script setup lang="ts">
import { useSeoMeta } from '#imports'

definePageMeta({})
defineI18nRoute({
  paths: {
    de: '/passwort-vergessen',
    en: '/forgot-password',
  },
})

const { public: pub } = useRuntimeConfig()
const { requestPasswordReset } = useAuth()
const { t } = useI18n()

useSeoMeta({ title: () => `${t('auth.forgot_password')} | ${pub.siteName}` })

const pending = ref(false)
const sent = ref(false)
const errorMessage = ref<string | null>(null)

const onSubmit = async (input: { email: string }) => {
  pending.value = true
  errorMessage.value = null
  const res = await requestPasswordReset(input)
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  sent.value = true
}
</script>

<template>
  <section class="mx-auto flex max-w-md flex-col gap-8 px-4 py-f-16 sm:px-6">
    <div class="text-center">
      <h1 class="font-heading text-f-4xl font-medium text-foreground">{{ $t('auth.forgot_password') }}</h1>
    </div>
    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <AuthPasswordResetRequestForm :pending="pending" :sent="sent" :error-message="errorMessage" @submit="onSubmit" />
    </div>
  </section>
</template>
