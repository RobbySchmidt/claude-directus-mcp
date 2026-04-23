<script setup lang="ts">
import { useSeoMeta } from '#imports'

const localePath = useLocalePath()

definePageMeta({})
defineI18nRoute({
  paths: {
    de: '/passwort-ruecksetzen',
    en: '/reset-password',
  },
})

const { public: pub } = useRuntimeConfig()
const { resetPassword } = useAuth()
const { t } = useI18n()
const route = useRoute()

useSeoMeta({ title: () => `${t('auth.reset_password')} | ${pub.siteName}` })

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const tokenMissing = computed(() => !token.value)

const pending = ref(false)
const success = ref(false)
const errorMessage = ref<string | null>(null)

const onSubmit = async (input: { password: string }) => {
  if (!token.value) return
  pending.value = true
  errorMessage.value = null
  const res = await resetPassword({ token: token.value, password: input.password })
  pending.value = false
  if (!res.ok) {
    errorMessage.value = res.message
    return
  }
  success.value = true
}
</script>

<template>
  <section class="mx-auto flex max-w-md flex-col gap-8 px-4 py-f-16 sm:px-6">
    <div class="text-center">
      <h1 class="font-heading text-f-4xl font-medium text-foreground">{{ $t('auth.reset_password') }}</h1>
    </div>
    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div v-if="tokenMissing" class="text-sm text-destructive" role="alert">
        {{ $t('common.error') }}
        <NuxtLink :to="localePath('/passwort-vergessen')" class="text-primary hover:underline">{{ $t('auth.reset_request') }}</NuxtLink>
      </div>
      <AuthPasswordResetForm v-else :pending="pending" :success="success" :error-message="errorMessage" @submit="onSubmit" />
    </div>
  </section>
</template>
